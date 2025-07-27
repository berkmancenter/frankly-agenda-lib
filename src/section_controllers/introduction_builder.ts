import { Agenda, AgendaItem, AgendaSection, createDurationByTimeUnit } from "../models/agenda_models.js";
import introductionData from '../section_data/initial_event/introduction.json';
import introductionRefresherData from '../section_data/follow_on_event/introduction.json'
import { ISectionBuilder } from "./section_builder.js";

export class IntroductionBuilder implements ISectionBuilder {

    topic: string;
    isInitial: boolean;
    longerIntro?: boolean;

    constructor(topic: string, eventNumber?: number, longerIntro?: boolean) {
        this.topic = topic;
        this.isInitial = eventNumber == 0 || eventNumber == null; // first event or single event
        this.longerIntro = longerIntro;
    }

    public createSection(): AgendaSection {
        // section info
        const introSection = new AgendaSection(introductionData.section, introductionData.sectionDescription);

        let introItems: AgendaItem[];

        if (this.isInitial) {
            introItems = this.createItems(introductionData);

        } else {
            introItems = this.createRefresherItems(introductionRefresherData, this.longerIntro);
        }

        for (let introItem of introItems) {
            introSection.addItem(introItem);
        }

        return introSection;
    }

    createItems(introData): AgendaItem[] {
        var agendaItems = [];

        const introDuration = createDurationByTimeUnit({ minutes: 10 });
        agendaItems.push(new AgendaItem(introData.items[0].title, introData.items[0].content, introDuration));

        return agendaItems;
    }

    createRefresherItems(introData, isLonger: boolean): AgendaItem[] {
        var agendaItems = [];

        const introDuration = createDurationByTimeUnit({ minutes: 6 });
        agendaItems.push(new AgendaItem(introData.items[0].title, introData.items[0].content, introDuration));

        if (isLonger) {
            const introDuration = createDurationByTimeUnit({ minutes: 10 });
            agendaItems.push(new AgendaItem(introData.items[1].title, introData.items[1].content, introDuration));
        }

        return agendaItems;
    }

    determineItems() {

    }
}