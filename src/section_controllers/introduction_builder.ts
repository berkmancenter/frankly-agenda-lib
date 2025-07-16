import { Agenda, AgendaItem, AgendaSection, createDuration } from "../models/agenda_models.js";
import introductionData from '../section_data/introduction.json';
import { ISectionBuilder } from "./section_builder.js";

export class IntroductionBuilder implements ISectionBuilder {

    topic: string;

    constructor(topic: string) {
        this.topic = topic;
    }

    public createSection(): AgendaSection {
        // section info
        const introSection = new AgendaSection(introductionData.section, introductionData.sectionDescription);
        const introItems: AgendaItem[] = this.createItems();

        for (let introItem of introItems) {
            introSection.addItem(introItem);
        }
        return introSection;
    }

    createItems(): AgendaItem[] {
        var agendaItems = [];
        for (let item of introductionData.items) {
            const introDuration = createDuration({ minutes: 10 });
            agendaItems.push(new AgendaItem(item.title, item.content, introDuration));
        }
        return agendaItems;
    }
}