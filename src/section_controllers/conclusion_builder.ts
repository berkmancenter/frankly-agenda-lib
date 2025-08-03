import { AgendaItem, AgendaSection, createDurationByTimeUnit } from "../models/agenda_models.js";
import { ISectionBuilder } from "./section_builder.js";
import { EventLengthType } from "../utils/global_enums.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/custom_error.js";

export class ConclusionBuilder implements ISectionBuilder {
    topic: string;
    isFollowOn: boolean;
    eventLengthType: EventLengthType;
    totalLength: number;
    warnings: CustomError[] = [];

    conclusionData;

    constructor(topic: string, eventLengthType: EventLengthType, isFollowOn: boolean) {
        this.topic = topic;
        this.isFollowOn = isFollowOn; // follow on in a series
        this.eventLengthType = eventLengthType;
        this.totalLength = 0;

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.conclusionData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/conclusion.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse conclusion data.", ErrorType.error, e);
        }
    }

    public getIntroLengthInMinutes(): number {
        return this.totalLength;
    }

    public createSection(): AgendaSection {
        // section info
        const conclusionSection = new AgendaSection(this.conclusionData.section, this.conclusionData.sectionDescription);

        const conclusionItems: AgendaItem[] = this.createItems();

        for (let introItem of conclusionItems) {
            conclusionSection.addItem(introItem);
        }
        return conclusionSection;
    }

    createItems(): AgendaItem[] {
        var agendaItems: AgendaItem[] = [];
        let tempDur;

        if (this.eventLengthType == EventLengthType.long) {
            tempDur = 10;
            // 10 minute for conversation reflection 
            const title: string = this.conclusionData.items[0].title;
            const content: string[] = this.conclusionData.items[0].content;
            const guidance: string[] = [this.conclusionData.items[0].guidance];

            this.totalLength = this.totalLength + tempDur;

            agendaItems.push(new AgendaItem(title, content, createDurationByTimeUnit({ minutes: tempDur }), null, guidance));

            // 4 for appreciation , already did reflection
            tempDur = 4;
        } else if (this.eventLengthType == EventLengthType.short) {
            // 5 for appreciation and wrap up
            tempDur = 5;
        } else {
            // 7 for appreciation and wrap up
            tempDur = 7;
        }

        const title: string = this.conclusionData.items[1].title;
        const content: string[] = this.conclusionData.items[1].content;
        const guidance: string[] = [this.conclusionData.items[1].guidance];

        this.totalLength = this.totalLength + tempDur;

        agendaItems.push(new AgendaItem(title, content, createDurationByTimeUnit({ minutes: tempDur }), null, guidance));

        return agendaItems;
    }
}