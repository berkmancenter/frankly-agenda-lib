import { Agenda, AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import introductionData from '../section_data/initial_event/introduction.json';
import introductionRefresherData from '../section_data/follow_on_event/introduction.json'
import { ISectionBuilder } from "./section_builder.js";
import { EventLengthType } from "../utils/global_enums.js";

export class IntroductionBuilder implements ISectionBuilder {

    topic: string;
    isFollowOn: boolean;
    eventLengthType: EventLengthType;
    totalLength: number;

    constructor(topic: string, eventLengthType: EventLengthType, isFollowOn: boolean) {
        this.topic = topic;
        this.isFollowOn = isFollowOn; // follow on in a series
        this.eventLengthType = eventLengthType;
        this.totalLength = 0;
    }

    public getIntroLengthInMinutes(): number {
        return this.totalLength;
    }

    public createSection(): AgendaSection {
        // section info
        const introSection = new AgendaSection(introductionData.section, introductionData.sectionDescription);
        let introItems: AgendaItem[];

        if (this.isFollowOn) {
            introItems = this.createRefresherItems(introductionRefresherData, this.eventLengthType);

        } else {
            introItems = this.createItems(introductionData, this.eventLengthType);
        }
        for (let introItem of introItems) {
            introSection.addItem(introItem);
        }
        return introSection;
    }

    createItems(introData, eventLengthType: EventLengthType): AgendaItem[] {
        var agendaItems = [];
        let introDuration: CustomDuration;
        let tempDur: number = 0;

        // First intro item
        if (eventLengthType == EventLengthType.long || eventLengthType == EventLengthType.regular) {
            tempDur = 10;
        } else {
            tempDur = 5;
        }

        introDuration = createDurationByTimeUnit({ minutes: tempDur });
        agendaItems.push(new AgendaItem(introData.items[0].title, introData.items[0].content, introDuration));
        this.totalLength = this.totalLength + tempDur;

        // second intro item 
        if (eventLengthType == EventLengthType.long) {
            tempDur = 10;
            const secondIntroDuration = createDurationByTimeUnit({ minutes: tempDur });
            agendaItems.push(new AgendaItem(introData.items[1].title, introData.items[1].content, secondIntroDuration));
            this.totalLength = this.totalLength + tempDur;
        }

        return agendaItems;
    }

    createRefresherItems(introData, eventLengthType: EventLengthType): AgendaItem[] {
        var agendaItems = [];
        let introDuration: CustomDuration;
        let tempDur: number = 0;

        // First intro item
        if (eventLengthType == EventLengthType.long) {
            tempDur = 4;
        } else if (eventLengthType == EventLengthType.short) {
            tempDur = 5;

        } else {
            tempDur = 7;
        }
        introDuration = createDurationByTimeUnit({ minutes: tempDur });
        this.totalLength = this.totalLength + tempDur;

        agendaItems.push(new AgendaItem(introData.items[0].title, introData.items[0].content, introDuration));

        // second intro item 
        if (eventLengthType == EventLengthType.long) {
            tempDur = 10;
            const secondIntroDuration = createDurationByTimeUnit({ minutes: tempDur });
            agendaItems.push(new AgendaItem(introData.items[1].title, introData.items[1].content, secondIntroDuration));
            this.totalLength = this.totalLength + tempDur;
        }

        return agendaItems;
    }
}