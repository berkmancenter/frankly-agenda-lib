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
        let sectionName = this.dialogueData.section;

        let dialogueItems: AgendaItem[];

        if (this.sectionDuration >= 20) {
            dialogueItems = await this.createItems(2);
        }
        else if (this.isMainGoal) {
            dialogueItems = await this.createItems(1);
        } else {
            dialogueItems = await this.createSubItem();
            sectionName = this.dialogueData.abbreviatedSectionName
        }

        const dialogueSection = new AgendaSection(sectionName, this.dialogueData.sectionDescription);

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

    async createSubItem(): Promise<AgendaItem[]> {
        const itemNumber = this.dialogueData.items.findIndex(item => item.id === "briefPersonalExperience");
        const item = this.dialogueData.items[itemNumber];
        const title: string = item.title;
        let contentString: string = item.content[0].replaceAll("this_topic_replace", this.topic);
        contentString = await this.llmService.getDialogueItem(contentString);
        const agendaItem: AgendaItem = new AgendaItem(title, [contentString]);
        agendaItem.duration = createDurationByTimeUnit({ minutes: this.sectionDuration });
        return [agendaItem];
    }
}