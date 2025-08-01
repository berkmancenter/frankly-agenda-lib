import { Agenda, AgendaItem, AgendaSection, CustomDuration } from "../models/agenda_models.js";
import dialogueData from "../section_data/initial_event/dialogue.json"
import { ISectionBuilder } from "./section_builder.js";

export class DialogueBuilder implements ISectionBuilder {

    topic: string;
    isMainGoal: boolean;
    sectionDuration: CustomDuration;

    constructor(topic: string, isMainGoal: boolean, sectionDuration: CustomDuration) {
        this.topic = topic;
        this.isMainGoal = isMainGoal;
        this.sectionDuration = sectionDuration;
    }

    public createSection(): AgendaSection {
        // section info
        const dialogueSection = new AgendaSection(dialogueData.section, dialogueData.sectionDescription);

        const recommendedDialogue: number[] = this.determineItems();
        const dialogueItems: AgendaItem[] = this.createItems(recommendedDialogue);

        for (let introItem of dialogueItems) {
            dialogueSection.addItem(introItem);
        }
        return dialogueSection;
    }

    createItems(recommendedDialogue: number[]): AgendaItem[] {
        var agendaItems: AgendaItem[] = [];
        for (let item in recommendedDialogue) {
            const title: string = dialogueData.items[item].title;
            const contentStrings: string[] = [];

            for (let content of dialogueData.items[item].content) {
                contentStrings.push(content.replaceAll("this_topic_replace", this.topic));
            }
            agendaItems.push(new AgendaItem(title, contentStrings));
        }
        return agendaItems;
    }

    determineItems(): number[] {
        if (this.isMainGoal && this.sectionDuration.getMinutes() >= 45) {
            return [0, 1]; // return both dialogue questions
        } else {
            return [0]
        }
    }
}