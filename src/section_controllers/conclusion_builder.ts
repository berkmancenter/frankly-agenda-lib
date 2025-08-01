import { AgendaItem, AgendaSection, createDurationByTimeUnit } from "../models/agenda_models";
import { ISectionBuilder } from "./section_builder";
import conclusionData from "../section_data/initial_event/conclusion.json";
import { EventLengthType } from "../utils/global_enums";

enum ConclusionElements {
    conversationReflections = "conversationReflections",
    appreciation = "appreciation"
}

export class ConclusionBuilder implements ISectionBuilder {
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
        const conclusionSection = new AgendaSection(conclusionData.section, conclusionData.sectionDescription);

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
            const title: string = conclusionData.items[0].title;
            const content: string[] = conclusionData.items[0].content;
            const guidance: string[] = [conclusionData.items[0].guidance];

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

        const title: string = conclusionData.items[1].title;
        const content: string[] = conclusionData.items[1].content;
        const guidance: string[] = [conclusionData.items[1].guidance];

        this.totalLength = this.totalLength + tempDur;

        agendaItems.push(new AgendaItem(title, content, createDurationByTimeUnit({ minutes: tempDur }), null, guidance));

        return agendaItems;
    }
}