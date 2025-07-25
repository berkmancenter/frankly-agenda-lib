import { ISectionBuilder } from "./section_builder";
import explorationData from "../section_data/initial_event/exploration.json"
import { AgendaItem, AgendaSection, CustomDuration } from "../models/agenda_models";

export class ExplorationBuilder implements ISectionBuilder {

    topic: string;
    sectionDuration: CustomDuration;
    participantCount: number;

    constructor(topic: string, sectionDuration: CustomDuration, participantCount: number) {
        this.topic = topic;
        this.sectionDuration = sectionDuration;
        this.participantCount = participantCount;
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

        let itemCount: number;
        this._generateTiming()
        // TODO generate more items using LLM

        return agendaItems;
    }

    _generateTiming() {
        let groupDiscussionTime = 5 + .75 * this.participantCount;

        console.log("\n\n Start: \n")

        let totalItems;
        let timePerParticipant;

        const participantTime = this.sectionDuration - groupDiscussionTime;
        console.log("participant time: " + participantTime);

        const participantTimeNeeded = this.participantCount * 2;

        console.log("participant time needed: " + participantTimeNeeded);

        let iterations = Math.floor(participantTime / participantTimeNeeded);

        let leftOverTime = participantTime % participantTimeNeeded;

        let tempIterations = iterations > 0 ? iterations : 1;

        let leftOverTimePerParticipant = Math.floor(10 * (leftOverTime / (this.participantCount * tempIterations))) / 10;

        console.log("iterations: " + iterations)
        console.log("leftover time: " + leftOverTime)
        console.log("leftOverTimePerParticipant: " + leftOverTimePerParticipant)

        if (iterations > 0) {
            totalItems = iterations;
            timePerParticipant = 2 + leftOverTimePerParticipant
        }
        else if (iterations == 0 && leftOverTimePerParticipant >= 1) {
            totalItems = 1;
            timePerParticipant = leftOverTimePerParticipant

        } else {
            throw Error();
        }

        if (timePerParticipant > 3) {
            let timeToRemove = this.participantCount * (timePerParticipant - 3);
            console.log("timeToRemove: " + timeToRemove)

            groupDiscussionTime = groupDiscussionTime + timeToRemove;
            timePerParticipant = 3;
        }

        console.log("\n")
        console.log("totalItems: " + totalItems)
        console.log("timePerParticipant: " + timePerParticipant)
        console.log("groupDiscussionTime: " + groupDiscussionTime)

        console.log("total time: " + (groupDiscussionTime + (timePerParticipant * this.participantCount * totalItems)));
    }

}