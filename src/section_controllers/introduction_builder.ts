import { Agenda, AgendaItem, AgendaSection, createDuration } from "../models/agenda_models.js";
import introductionData from '../section_data/initial_event/introduction.json';
import introductionRefresherData from '../section_data/follow_on_event/introduction.json'
import { ISectionBuilder } from "./section_builder.js";

export class IntroductionBuilder implements ISectionBuilder {

    topic: string;
    isInitial: boolean;

    constructor(topic: string, isInitial: boolean) {
        this.topic = topic;
        this.isInitial = isInitial;
    }

    public createSection(): AgendaSection {
        // section info
        const introSection = new AgendaSection(introductionData.section, introductionData.sectionDescription);

        let introItems: AgendaItem[];

        if (this.isInitial) {
            introItems = this.createItems(introductionData, 10);

        } else {
            introItems = this.createItems(introductionRefresherData, 6);
        }

        for (let introItem of introItems) {
            introSection.addItem(introItem);
        }

        return introSection;
    }

    createItems(introData, duration: number): AgendaItem[] {
        var agendaItems = [];
        for (let item of introData.items) {
            const introDuration = createDuration({ minutes: duration });
            agendaItems.push(new AgendaItem(item.title, item.content, introDuration));
        }
        return agendaItems;
    }
}