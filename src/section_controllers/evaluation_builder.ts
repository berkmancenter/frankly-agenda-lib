import { AgendaItem, AgendaSection } from "../models/agenda_models";
import { ISectionBuilder } from "./section_builder";
import evaluationData from "../section_data/evaluation.json"

export class EvaluationBuilder implements ISectionBuilder {
    topic: string;
    concreteDecision: boolean;

    constructor(topic: string, concreteDecision: boolean) {
        this.topic = topic;
        this.concreteDecision = concreteDecision;
    }

    public createSection(): AgendaSection {
        const evalSection = new AgendaSection(evaluationData.section, evaluationData.sectionDescription);

        const recommendedItems: number[] = this.determineItems();

        const evalItems: AgendaItem[] = this.createItems(recommendedItems);

        for (let evalItem of evalItems) {
            evalSection.addItem(evalItem);
        }

        return evalSection;
    }

    createItems(recommendedNorms: number[]): AgendaItem[] {
        var agendaItems = [];

        if (this.concreteDecision) {
            for (var i = 0; i < evaluationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = evaluationData.concrete_items[i].title; // first string is the title
                    const content = evaluationData.concrete_items[i].content; // remaining strings are the content bullets
                    agendaItems.push(new AgendaItem(title, content));
                }
            }
        } else {
            for (var i = 0; i < evaluationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = evaluationData.non_concrete_items[i].title; // first string is the title
                    const content = evaluationData.non_concrete_items[i].content; // remaining strings are the content bullets
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