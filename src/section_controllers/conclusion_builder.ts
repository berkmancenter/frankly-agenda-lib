import { AgendaItem, AgendaSection } from "../models/agenda_models";
import { ISectionBuilder } from "./section_builder";
import conclusionData from "../section_data/initial_event/conclusion.json";

enum ConclusionElements {
    conversationReflections = "conversationReflections",
    appreciation = "appreciation"
}

export class ConclusionBuilder implements ISectionBuilder {
    topic: string;

    constructor(topic: string) {
        this.topic = topic;
    }

    public createSection(): AgendaSection {
        // section info
        const dialogueSection = new AgendaSection(conclusionData.section, conclusionData.sectionDescription);

        const recommendedConclusion: ConclusionElements[] = this.determineItems();

        const dialogueItems: AgendaItem[] = this.createItems(recommendedConclusion);

        for (let introItem of dialogueItems) {
            dialogueSection.addItem(introItem);
        }
        return dialogueSection;
    }

    createItems(recommendedConclusion: ConclusionElements[]): AgendaItem[] {
        var agendaItems: AgendaItem[] = [];

        for (let i = 0; i < recommendedConclusion.length; i++) {
            const title: string = conclusionData.items[i].title;
            const content: string[] = conclusionData.items[i].content;
            const guidance: string[] = [conclusionData.items[i].guidance];

            agendaItems.push(new AgendaItem(title, content, null, null, guidance));

        }
        return agendaItems;
    }

    determineItems(): ConclusionElements[] {
        return [ConclusionElements.appreciation]
    }
}