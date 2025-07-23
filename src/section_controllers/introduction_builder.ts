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

        if (this.isInitial) {
            const introItems: AgendaItem[] = this.createItems();
            for (let introItem of introItems) {
                introSection.addItem(introItem);
            }
        } else {
            const introDuration = createDuration({ minutes: 6 });
            const basicRefresher: AgendaItem = new AgendaItem(introductionRefresherData.items[0].title, introductionRefresherData.items[0].content, introDuration);
            introSection.addItem(basicRefresher);
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