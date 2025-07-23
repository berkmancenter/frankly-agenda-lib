import { ISectionBuilder } from "./section_builder";
import explorationData from "../section_data/initial_event/exploration.json"
import { AgendaItem, AgendaSection } from "../models/agenda_models";

export class ExplorationBuilder implements ISectionBuilder {

    topic: string;

    constructor(topic: string) {
        this.topic = topic;
    }

    createSection() {
        // section info
        const explorationSection = new AgendaSection(explorationData.section, explorationData.sectionDescription);

        const explorationItems: AgendaItem[] = this.createItems();

        for (let introItem of explorationItems) {
            explorationSection.addItem(introItem);
        }
        return explorationSection;
    }

    createItems() {
        // TODO only return topic recommendations if we don't have background to give them
        var agendaItems = [];

        const title: string = explorationData.items[0].title; // topic recommendations
        const contentStrings: string[] = explorationData.items[0].content;
        agendaItems.push(new AgendaItem(title, contentStrings));

        // TODO generate more items using LLM

        return agendaItems;
    }

}