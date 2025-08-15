import { ISectionBuilder } from "./section_builder.js";
import { AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { numToString } from "../utils/helper_functions.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
import { LangChainLLMService } from "../services/langchain_services.js";
import { ExplorationPromptFormat, TopicBackgroundFormat } from "../services/langchain_formatters.js";

export class ExplorationBuilder implements ISectionBuilder {

    topic: string;
    sectionDuration: number;
    totalSectionDuration: number;
    upperParticipantCount: number;
    lowerParticipantCount: number;
    llmService: LangChainLLMService;

    // timing for prompt variables
    idealMinutesToSpeak: number = 2;
    maxMinutesToSpeak: number = 3;
    minimumMinutesToSpeak: number = 1.5;
    groupDiscussionTime: number;
    totalPrompts: number;
    maxTimePerParticipant: number;
    minTimePerParticipant: number;
    totalMinutesPerPrompt: number;

    backgroundInformationTime: number = 3;

    explorationData;

    warnings: CustomError[] = [];

    constructor(topic: string, sectionDuration: number, lowerParticipantCount: number, upperParticipantCount: number, llmService: LangChainLLMService) {
        this.topic = topic;
        this.totalSectionDuration = sectionDuration;
        this.sectionDuration = sectionDuration;
        this.lowerParticipantCount = lowerParticipantCount;
        if (this.lowerParticipantCount < 2) this.lowerParticipantCount = 2;
        this.upperParticipantCount = upperParticipantCount;
        this.llmService = llmService;

        this.groupDiscussionTime = this._calculateInitialGroupDiscussionTime();

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.explorationData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/exploration.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse exploration section data.", ErrorType.error, e);
        }
    }

    async createSection(): Promise<AgendaSection> {
        // section info
        const explorationSection = new AgendaSection(this.explorationData.section, this.explorationData.sectionDescription);

        // create items
        const instructionItem: AgendaItem = await this._handleTopicBackground();
        const explorationItems: AgendaItem[] = await this._createItems();

        // add items
        instructionItem != null && explorationSection.addItem(instructionItem);
        for (let introItem of explorationItems) {
            explorationSection.addItem(introItem);
        }
        explorationSection.duration = createDurationByTimeUnit({ minutes: this.totalSectionDuration });

        // get rid of individual timing if there are timing issues
        if (this.warnings.some(warning => ErrorCategory[warning.name] === ErrorCategory.TimingError)) {
            for (let i = 0; i < explorationSection.items.length; i++) {
                explorationSection.items[i].duration = null;
            }
        }
        return explorationSection;
    }

    async _handleTopicBackground(): Promise<AgendaItem> {
        let instructionItem: AgendaItem;

        const humanQuery = this.explorationData.llm_prompts.find(item => item.title == "Topic Background Query").content.replaceAll("this_topic_replace", this.topic);

        const needsBackgroundInfo: TopicBackgroundFormat = await this.llmService.determineBackgroundInfoFromLLM(humanQuery);

        if (needsBackgroundInfo.answer == true) {
            instructionItem = this._createTopicBackgroundItem(needsBackgroundInfo.explanation);
            this.sectionDuration = this.totalSectionDuration - this.backgroundInformationTime;
        }
        return instructionItem;
    }

    _createTopicBackgroundItem(explanation: string): AgendaItem {
        const backgroundItem = this.explorationData.items.find(item => item.id == "topicBackground");

        const title: string = backgroundItem.title; // topic recommendations

        const contentStrings: string[] = backgroundItem.content;

        const newItem = new AgendaItem(title, contentStrings);
        newItem.importance = [explanation];

        newItem.duration = createDurationByTimeUnit({ minutes: 5 });
        newItem.guidance = [backgroundItem.guidance[0].replaceAll("this_topic_replace", this.topic)];
        newItem.guidance.push(backgroundItem.guidance[1].replaceAll("this_topic_replace", this.topic));

        return newItem;
    }


    async _createItems() {
        // TODO only return topic recommendations if we don't have background to give them
        var agendaItems = [];

        const discussionItems = this.explorationData.items.find(item => item.title == "Group Discussion");

        const groupDiscussionTitle: string = discussionItems.title;
        const groupDiscussionContent: string[] = discussionItems.content;

        this._calculateTimingandPromptQuantity();

        for (let i = 0; i < this.totalPrompts; i++) {
            // TODO: generate using LLM
            const promptTitle: string = "Prompt " + numToString(i + 1);
            const promptHumanQuery = this.explorationData.llm_prompts.find(item => item.title == "Prompt Query").content.replaceAll("this_topic_replace", this.topic);

            const llmPrompt: ExplorationPromptFormat = await this.llmService.getExplorationPromptFromLLM(promptHumanQuery);

            const item: AgendaItem = new AgendaItem(promptTitle, [llmPrompt.prompt]);

            item.importance = [llmPrompt.explanation];

            item.guidance = ["Each participant takes " + Math.round(this.maxTimePerParticipant) + " to " + Math.round(this.minTimePerParticipant) + " minutes to explore the question prompt."];

            // add item for group discussion
            const groupDiscussionItem: AgendaItem = new AgendaItem(groupDiscussionTitle, groupDiscussionContent);

            item.duration = createDurationByTimeUnit({ minutes: this.totalMinutesPerPrompt });
            groupDiscussionItem.duration = createDurationByTimeUnit({ minutes: this.groupDiscussionTime });

            agendaItems.push(item);
            agendaItems.push(groupDiscussionItem);

        }
        return agendaItems;
    }

    _calculateInitialGroupDiscussionTime(): number {
        const avgCount: number = ((this.lowerParticipantCount + this.upperParticipantCount) / 2);

        // amount of time for group to discuss
        // at least five minutes 
        // then 3/4 of a minute for each participant on average
        let discussionTime: number = 5 + .75 * avgCount;
        return discussionTime;
    }

    ///
    // This function calculates how many prompts we need, 
    // and how much time each participant has to speak 
    ///
    _calculateTimingandPromptQuantity() {
        const lowerCount: number = this.lowerParticipantCount;
        const upperCount: number = this.upperParticipantCount;
        const avgCount: number = ((lowerCount + upperCount) / 2);

        const sectionDuration: number = this.sectionDuration;

        // how many total prompts
        // based on time available and number of participants 
        let initialPrompts: number;
        let totalPrompts: number;

        // total time each participant can have to talk
        let timePerParticipant_maxparts: number; // with max amount of participants
        let timePerParticipant_minparts: number; // with min amount of participants

        // calculate how much total time needed for one prompt
        // start with the ideal amount of speaking time for each participant 
        const participantTimeNeeded_minParts = lowerCount * this.idealMinutesToSpeak + this.groupDiscussionTime;
        const participantTimeNeeded_maxParts = upperCount * this.idealMinutesToSpeak + this.groupDiscussionTime;

        // calculate how many prompts can be fit into the time 
        // based on time and on average how much time is needed for participants to speak on one item
        // go with lowest amount, we don't want to squeeze in more prompts if not enough time
        initialPrompts = Math.floor(sectionDuration / ((participantTimeNeeded_minParts + participantTimeNeeded_maxParts) / 2 + this.groupDiscussionTime));

        // but then there will probably be leftover time
        // calculate total leftover time for most and least amount of participants in range 
        let leftOverTime_minParts = sectionDuration - this.groupDiscussionTime - (participantTimeNeeded_minParts * initialPrompts);
        let leftOverTime_maxParts = sectionDuration - this.groupDiscussionTime - (participantTimeNeeded_maxParts * initialPrompts);

        // if floor gets us to zero prompts, bump it up
        // we need at least one prompt
        totalPrompts = initialPrompts > 0 ? initialPrompts : 1;

        // calculate the leftover time per participant per prompt
        let leftOverTimePerParticipant_minParts = Math.floor(10 * (leftOverTime_minParts / (lowerCount * totalPrompts))) / 10;
        let leftOverTimePerParticipant_maxParts = Math.floor(10 * (leftOverTime_maxParts / (upperCount * totalPrompts))) / 10;

        if (initialPrompts >= 1) {
            // more than 1 prompt, give each participant the leftover time
            timePerParticipant_maxparts = this.idealMinutesToSpeak + leftOverTimePerParticipant_maxParts;
            timePerParticipant_minparts = this.idealMinutesToSpeak + leftOverTimePerParticipant_minParts;
        }
        else if (initialPrompts < 1 && leftOverTimePerParticipant_maxParts >= .75) {
            // Only 1 prompt where each participant gets only the leftover time 
            timePerParticipant_maxparts = leftOverTimePerParticipant_maxParts;
            timePerParticipant_minparts = leftOverTimePerParticipant_minParts;
        } else {
            // if, with the max amount of participants, each participant gets 
            // less than 3/4 of a minute, throw an error
            // that is not enough time to speak
            timePerParticipant_maxparts = leftOverTimePerParticipant_maxParts;
            timePerParticipant_minparts = leftOverTimePerParticipant_minParts;
            this.warnings.push(new CustomError(ErrorCategory.TimingError, "Not enough time for each participant to speak during the exploration section. Consider making the event longer or hosting a series of events.", ErrorType.warning));
        }

        // if, with the minimum participants, each participant gets more 
        // than the max minutes to speak, add some time to the group discussion
        // more than the max amount of minutes is too much time 
        if (timePerParticipant_minparts > this.maxMinutesToSpeak) {
            // with least participants, delta from max amount
            let minDelta = timePerParticipant_minparts - this.maxMinutesToSpeak;

            // with the most participants, delta from max amount
            let maxDelta = timePerParticipant_maxparts - this.idealMinutesToSpeak;

            // keep some time for the case with max participants 
            // minDelta = minDelta - maxDelta;

            // based on these deltas, how much time can we give to group discussion
            // being conservative with our estimates to not use too much time, so use lowerCount
            let initialtimeToRemove = lowerCount * Math.min((minDelta + maxDelta), minDelta);
            let timeToRemove = initialtimeToRemove;
            const timePerPromptWithDiscussion = sectionDuration / totalPrompts;

            if (initialtimeToRemove + this.groupDiscussionTime > timePerPromptWithDiscussion / 2) {
                timeToRemove = timePerPromptWithDiscussion / 2 - this.groupDiscussionTime;
            }
            this.groupDiscussionTime = this.groupDiscussionTime + timeToRemove;

            timePerParticipant_minparts = this.maxMinutesToSpeak + (initialtimeToRemove - timeToRemove) / lowerCount; // set to max time
            timePerParticipant_maxparts = this.minimumMinutesToSpeak + (initialtimeToRemove - timeToRemove) / upperCount; // set to minimum time
        }

        // set variables
        this.minTimePerParticipant = timePerParticipant_minparts;
        this.maxTimePerParticipant = timePerParticipant_maxparts;
        this.totalPrompts = totalPrompts;
        this.totalMinutesPerPrompt = sectionDuration / totalPrompts - this.groupDiscussionTime;
    }
}