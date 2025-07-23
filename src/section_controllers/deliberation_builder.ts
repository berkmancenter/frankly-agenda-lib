import { AgendaItem, AgendaSection } from "../models/agenda_models";
import { ISectionBuilder } from "./section_builder";
import deliberationData from "../section_data/initial_event/deliberation.json"

export class DeliberationBuilder implements ISectionBuilder {
    topic: string;
    concreteDecision: boolean;

    constructor(topic: string, concreteDecision: boolean) {
        this.topic = topic;
        this.concreteDecision = concreteDecision;
    }

    public createSection(): AgendaSection {
        const deliberationSection = new AgendaSection(deliberationData.section, deliberationData.sectionDescription);

        const recommendedItems: number[] = this.determineItems();

        const deliberationItems: AgendaItem[] = this.createItems(recommendedItems);

        for (let deliberationItem of deliberationItems) {
            deliberationSection.addItem(deliberationItem);
        }

        return deliberationSection;
    }

    createItems(recommendedNorms: number[]): AgendaItem[] {
        var agendaItems = [];

        if (this.concreteDecision) {
            for (var i = 0; i < deliberationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = deliberationData.concrete_items[i].title; // first string is the title
                    const content = deliberationData.concrete_items[i].content; // remaining strings are the content bullets
                    agendaItems.push(new AgendaItem(title, content));
                }
            }
        } else {
            for (var i = 0; i < deliberationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = deliberationData.non_concrete_items[i].title; // first string is the title
                    const content = deliberationData.non_concrete_items[i].content; // remaining strings are the content bullets
                    agendaItems.push(new AgendaItem(title, content));
                }
            }
        }
        return agendaItems;
    }

    determineItems(): number[] {
        /// TODO: use LLM to determine which items to recommend
        return [0,2];
    }
}