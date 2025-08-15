import { Agenda, AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { ISectionBuilder } from "./section_builder.js";
import { EventLengthType } from "../utils/global_enums.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";

export class IntroductionBuilder implements ISectionBuilder {

    topic: string;
    isFollowOn: boolean;
    eventLengthType: EventLengthType;
    totalLength: number;
    warnings: CustomError[] = [];

    introductionData;
    introductionRefresherData;

    constructor(topic: string, eventLengthType: EventLengthType, isFollowOn: boolean) {
        this.topic = topic;
        this.isFollowOn = isFollowOn; // follow on in a series
        this.eventLengthType = eventLengthType;
        this.totalLength = 0;

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.introductionData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/introduction.json'), 'utf-8'));
            this.introductionRefresherData = JSON.parse(readFileSync(join(__dirname, '../section_data/follow_on_event/introduction.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse introduction section data.", ErrorType.error, e);
        }
    }

    public getIntroLengthInMinutes(): number {
        return this.totalLength;
    }

    public async createSection(): Promise<AgendaSection> {
        // section info
        const introSection = new AgendaSection(this.introductionData.section, this.introductionData.sectionDescription);
        let introItems: AgendaItem[];

        if (this.isFollowOn) {
            introItems = this.createRefresherItems(this.introductionRefresherData, this.eventLengthType);

        } else {
            introItems = this.createItems(this.introductionData, this.eventLengthType);
        }
        for (let introItem of introItems) {
            introSection.addItem(introItem);
        }
        introSection.duration = createDurationByTimeUnit({ minutes: this.totalLength })
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