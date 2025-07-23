import { Agenda, AgendaItem, AgendaSection } from "../models/agenda_models.js";
import dialogueData from "../section_data/initial_event/dialogue.json"
import { ISectionBuilder } from "./section_builder.js";

export class DialogueBuilder implements ISectionBuilder {

    topic: string;

    constructor(topic: string) {
        this.topic = topic;
    }

    public createSection(): AgendaSection {
        // section info
        const dialogueSection = new AgendaSection(dialogueData.section, dialogueData.sectionDescription);

        const recommendedDialogue: number = this.determineItems();

        const dialogueItems: AgendaItem[] = this.createItems(recommendedDialogue);

        for (let introItem of dialogueItems) {
            dialogueSection.addItem(introItem);
        }
        return dialogueSection;
    }

    createItems(recommendedDialogue: number): AgendaItem[] {
        var agendaItems: AgendaItem[] = [];
        const title: string = dialogueData.items[recommendedDialogue].title;
        const contentStrings: string[] = [];

        for (let content of dialogueData.items[recommendedDialogue].content) {
            contentStrings.push(content.replaceAll("this_topic_replace", this.topic));
        }
        agendaItems.push(new AgendaItem(title, contentStrings));

        return agendaItems;
    }

    determineItems(): number {
        /// TODO: use LLM OR logic to determine which items to recommend
        return 1;
    }

}