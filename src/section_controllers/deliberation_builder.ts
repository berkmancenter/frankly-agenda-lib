import { AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { ISectionBuilder } from "./section_builder.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
export class DeliberationBuilder implements ISectionBuilder {
    topic: string;
    concreteDecision: boolean;
    sectionDuration: number;
    warnings: CustomError[] = [];


    deliberationData;

    constructor(topic: string, concreteDecision: boolean, sectionDuration: number) {
        this.topic = topic;
        this.concreteDecision = concreteDecision;
        this.sectionDuration = sectionDuration;

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.deliberationData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/deliberation.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse deliberation section data.", ErrorType.error, e);
        }
    }

    public async createSection(): Promise<AgendaSection> {
        const deliberationSection = new AgendaSection(this.deliberationData.section, this.deliberationData.sectionDescription);

        const recommendedItems: number[] = this.determineItems();

        const deliberationItems: AgendaItem[] = this.createItems(recommendedItems);

        for (let deliberationItem of deliberationItems) {
            deliberationSection.addItem(deliberationItem);
        }
        deliberationSection.duration = createDurationByTimeUnit({ minutes: this.sectionDuration });

        return deliberationSection;
    }

    createItems(recommendedNorms: number[]): AgendaItem[] {
        var agendaItems = [];

        if (this.concreteDecision) {
            for (var i = 0; i < this.deliberationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = this.deliberationData.concrete_items[i].title; // first string is the title
                    const content = this.deliberationData.concrete_items[i].content; // remaining strings are the content bullets
                    agendaItems.push(new AgendaItem(title, content));
                }
            }
        } else {
            for (var i = 0; i < this.deliberationData.concrete_items.length; i++) {
                if (i in recommendedNorms) {
                    const title = this.deliberationData.non_concrete_items[i].title; // first string is the title
                    const content = this.deliberationData.non_concrete_items[i].content; // remaining strings are the content bullets
                    agendaItems.push(new AgendaItem(title, content));
                }
            }
        }
        return agendaItems;
    }

    determineItems(): number[] {
        /// TODO: use LLM to determine which items to recommend
        return [0, 2];
    }
}