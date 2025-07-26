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
            const promptTitle: string = "Prompt " + numToString(i);
            const tempPrompt = "hello, I'm prompt " + i;

            const item: AgendaItem = new AgendaItem(promptTitle, [tempPrompt]);

            item.duration = createDurationByTimeUnit({ minutes: this.totalMinutesPerPrompt });
            item.guidance = ["Each participant takes " + this.maxTimePerParticipant + " to " + this.minTimePerParticipant + " minutes to explore the question prompt."];
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
        console.log("average count: " + avgCount + " and initial group discussion time: " + discussionTime);

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

        console.log("total participant time for event: " + sectionDuration);

        // calculate how much total time needed for one prompt
        // start with the ideal amount of speaking time for each participant 
        const participantTimeNeeded_minParts = lowerCount * this.idealMinutesToSpeak + this.groupDiscussionTime;
        const participantTimeNeeded_maxParts = upperCount * this.idealMinutesToSpeak + this.groupDiscussionTime;

        console.log("We need " + participantTimeNeeded_minParts + " for minumum participants and " + participantTimeNeeded_maxParts + " for maximum participants.");

        // calculate how many prompts can be fit into the time 
        // based on time and on average how much time is needed for participants to speak on one item
        // go with lowest amount, we don't want to squeeze in more prompts if not enough time
        initialPrompts = Math.floor(sectionDuration / ((participantTimeNeeded_minParts + participantTimeNeeded_maxParts) / 2));

        console.log("calculating " + initialPrompts + " total prompts at the beginning.");

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

        console.log("There will be " + leftOverTimePerParticipant_minParts + " minutes per participant per prompt leftover if minimum participants and " + leftOverTimePerParticipant_maxParts + " leftover for maximum participants.\n");

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

        console.log("With minimum participants, " + timePerParticipant_minparts + " minutes per participant per prompt to speak. With maximum participants, " + timePerParticipant_maxparts + " per participant to speak.");

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
            timePerParticipant_maxparts = this.minimumMinutesToSpeak; // set to ideal time

            console.log("But it's " + minDelta + " too much time for min participants and " + maxDelta + " too much time for max participants. So, adding " + timeToRemove + " minutes time to group discussion.");
        }

        // set variables
        this.minTimePerParticipant = timePerParticipant_minparts;
        this.maxTimePerParticipant = timePerParticipant_maxparts;
        this.totalPrompts = totalPrompts;
        this.totalMinutesPerPrompt = sectionDuration / totalPrompts - this.groupDiscussionTime;

        console.log("\n")
        console.log("totalItems: " + totalPrompts)
        console.log("groupDiscussionTime: " + this.groupDiscussionTime)

        console.log("time per participant: min " + this.minTimePerParticipant)
        console.log("time per participant: max " + this.maxTimePerParticipant)

        console.log("total time for fewest participants: " + (totalPrompts * (this.minTimePerParticipant * this.lowerParticipantCount + this.groupDiscussionTime)));

        console.log("total time for maximum participants: " + (totalPrompts * (this.maxTimePerParticipant * this.upperParticipantCount + this.groupDiscussionTime)));

        console.log("total time for average participants: " + (totalPrompts * (((this.maxTimePerParticipant + this.minTimePerParticipant) / 2) * avgCount + this.groupDiscussionTime)));

        console.log("total minutes per prompt: " + this.totalMinutesPerPrompt);

        console.log("total minutes per prompt with group discussion: " + (this.totalMinutesPerPrompt + this.groupDiscussionTime));

        let neededByParts: number = ((this.minTimePerParticipant + this.maxTimePerParticipant) / 2) * avgCount + this.groupDiscussionTime;
        console.log("needed per prompt based on calculations: " + neededByParts)

        let neededByPartsMinCouldBe: number = this.maxTimePerParticipant * lowerCount + this.groupDiscussionTime;
        console.log("needed per prompt based on calculations most min: " + neededByPartsMinCouldBe)

        let neededByPartsMaxCouldBe: number = this.minTimePerParticipant * upperCount + this.groupDiscussionTime;
        console.log("needed per prompt based on calculations most max: " + neededByPartsMaxCouldBe)
    }
}