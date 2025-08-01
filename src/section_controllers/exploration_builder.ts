import { ISectionBuilder } from "./section_builder";
import explorationData from "../section_data/initial_event/exploration.json"
import { AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models";
import { numToString } from "../utils/helper_functions";

export class ExplorationBuilder implements ISectionBuilder {

    topic: string;
    sectionDuration: CustomDuration;
    upperParticipantCount: number;
    lowerParticipantCount: number;

    // timing for prompt variables
    idealMinutesToSpeak: number = 2;
    maxMinutesToSpeak: number = 3;
    minimumMinutesToSpeak: number = 1;
    groupDiscussionTime: number;
    totalPrompts: number;
    maxTimePerParticipant: number;
    minTimePerParticipant: number;
    totalMinutesPerPrompt: number;

    constructor(topic: string, sectionDuration: CustomDuration, lowerParticipantCount: number, upperParticipantCount: number) {
        this.topic = topic;
        this.sectionDuration = sectionDuration;
        this.lowerParticipantCount = lowerParticipantCount;
        this.upperParticipantCount = upperParticipantCount;

        this.groupDiscussionTime = this._calculateInitialGroupDiscussionTime();
    }

    createSection() {
        // section info
        const explorationSection = new AgendaSection(explorationData.section, explorationData.sectionDescription);

        const instructionItem: AgendaItem = this._createInstructionItems();
        explorationSection.addItem(instructionItem);

        const explorationItems: AgendaItem[] = this._createItems();
        for (let introItem of explorationItems) {
            explorationSection.addItem(introItem);
        }
        return explorationSection;
    }

    _createInstructionItems(): AgendaItem {
        const title: string = explorationData.items[0].title; // topic recommendations
        const contentStrings: string[] = explorationData.items[0].content;
        return new AgendaItem(title, contentStrings);
    }

    _createItems() {
        // TODO only return topic recommendations if we don't have background to give them
        var agendaItems = [];

        const groupDiscussionTitle: string = explorationData.items[1].title;
        const groupDiscussionContent: string[] = explorationData.items[1].content;

        this._calculateTimingandPromptQuantity();

        for (let i = 0; i < this.totalPrompts; i++) {
            // TODO: generate using LLM
            const promptTitle: string = "Prompt " + numToString(i+1);
            const tempPrompt = "hello, I'm prompt " + i;

            const item: AgendaItem = new AgendaItem(promptTitle, [tempPrompt]);

            item.duration = createDurationByTimeUnit({ minutes: this.totalMinutesPerPrompt });
            item.guidance = ["Each participant takes " + Math.round(this.maxTimePerParticipant) + " to " + Math.round(this.minTimePerParticipant) + " minutes to explore the question prompt."];
            agendaItems.push(item);

            // add item for group discussion
            const groupDiscussionItem: AgendaItem = new AgendaItem(groupDiscussionTitle, groupDiscussionContent);

            groupDiscussionItem.duration = createDurationByTimeUnit({ minutes: this.groupDiscussionTime });
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

        const sectionDuration: number = this.sectionDuration.getMinutes();

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
        initialPrompts = Math.floor(sectionDuration / ((participantTimeNeeded_minParts + participantTimeNeeded_maxParts) / 2));

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
            throw Error("Not enough time for each participant to speak.");
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
            let timeToRemove = lowerCount * (minDelta + maxDelta);

            this.groupDiscussionTime = this.groupDiscussionTime + timeToRemove;
            timePerParticipant_minparts = this.maxMinutesToSpeak; // set to max time
            timePerParticipant_maxparts = this.minimumMinutesToSpeak; // set to minimum time
        }

        // set variables
        this.minTimePerParticipant = timePerParticipant_minparts;
        this.maxTimePerParticipant = timePerParticipant_maxparts;
        this.totalPrompts = totalPrompts;
        this.totalMinutesPerPrompt = sectionDuration / totalPrompts - this.groupDiscussionTime;
    }
}