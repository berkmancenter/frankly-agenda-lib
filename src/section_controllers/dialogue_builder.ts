import { Agenda, AgendaItem, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { ISectionBuilder } from "./section_builder.js";
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
import { LangChainLLMService } from "../services/langchain_services.js";
import { numToString } from "../utils/helper_functions.js";

export class DialogueBuilder implements ISectionBuilder {

    llmService: LangChainLLMService;
    topic: string;
    isMainGoal: boolean;
    sectionDuration: number;
    warnings: CustomError[] = [];

    dialogueData;

    constructor(topic: string, isMainGoal: boolean, sectionDuration: number, llmService: LangChainLLMService) {
        this.topic = topic;
        this.isMainGoal = isMainGoal;
        this.sectionDuration = sectionDuration;
        this.llmService = llmService;

        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.dialogueData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/dialogue.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse dialogue section data.", ErrorType.error, e);
        }
    }

    public async createSection(): Promise<AgendaSection> {
        // section info
        const dialogueSection = new AgendaSection(this.dialogueData.section, this.dialogueData.sectionDescription);

        const recommendedItemQuant: number = this.determineNumberOfItems();

        const dialogueItems: AgendaItem[] = await this.createItems(recommendedItemQuant);

        for (let introItem of dialogueItems) {
            dialogueSection.addItem(introItem);
        }
        dialogueSection.duration = createDurationByTimeUnit({ minutes: this.sectionDuration });
        return dialogueSection;
    }

    async createItems(recommendedItemQuant: number): Promise<AgendaItem[]> {
        var agendaItems: AgendaItem[] = [];
        const durationInMinutes: number = this.sectionDuration / recommendedItemQuant;
        for (let i = 0; i < recommendedItemQuant; i++) {
            const title: string = "Prompt " + numToString(i + 1);
            const contentString: string = await this.llmService.getDialogueItem();
            const agendaItem: AgendaItem = new AgendaItem(title, [contentString]);
            agendaItem.duration = createDurationByTimeUnit({ minutes: durationInMinutes });
            agendaItems.push(agendaItem);
        }
        return agendaItems;
    }

    determineNumberOfItems(): number {
        if (this.isMainGoal && this.sectionDuration >= 45) {
            return 2; // return both dialogue questions
        } else {
            return 1;
        }
    }
}