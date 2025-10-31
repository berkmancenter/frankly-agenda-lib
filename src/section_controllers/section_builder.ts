import { Agenda, AgendaSection, createDurationByTimeUnit, CustomDuration } from "../models/agenda_models.js";
import { EventInputs, EventSection } from "../models/input_models.js";
import { CommunityNormBuilder } from "./community_norm_builder.js";
import { DialogueBuilder } from "./dialogue_builder.js";
import { DeliberationBuilder } from "./deliberation_builder.js";
import { ExplorationBuilder } from "./exploration_builder.js";
import { IntroductionBuilder } from "./introduction_builder.js";
import { EventLengthType, Goals } from "../utils/global_enums.js";
import { ConclusionBuilder } from "./conclusion_builder.js";
import { CustomError } from "../utils/result_handling.js";
import { LangChainLLMService } from "../services/langchain_services.js";

export interface ISectionBuilder {
    topic: string;
    warnings: CustomError[];

    createSection(): Promise<AgendaSection>;
}

export class SectionBuilder {
    agenda: Agenda;
    eventInput: EventInputs;
    middleSectionBuilders: ISectionBuilder[] = [];
    sectionList: EventSection;
    eventLengthType: EventLengthType;
    llmService: LangChainLLMService;
    firstExploration: boolean;


    warnings: CustomError[] = [];


    isFollowOn: boolean;

    constructor(agenda: Agenda, eventInput: EventInputs, sectionList: EventSection, llmService: LangChainLLMService, firstExploration: boolean) {
        this.agenda = agenda;
        this.eventInput = eventInput;
        this.sectionList = sectionList;
        this.agenda.addDuration(this.eventInput.eventLength);
        this.isFollowOn = this.eventInput.isSeries == true && this.agenda.eventNumber > 0;
        this.llmService = llmService;
        this.firstExploration = firstExploration;
    }

    public async buildStructure(): Promise<void> {
        // what event length type 
        if (this.agenda.duration.hours > 1.25) {
            this.eventLengthType = EventLengthType.long;
        } else if (this.agenda.duration.hours < 1 && this.agenda.duration.minutes <= 30) {
            this.eventLengthType = EventLengthType.short;
        } else {
            this.eventLengthType = EventLengthType.regular;
        }
        // introduction
        const intro: IntroductionBuilder = new IntroductionBuilder(this.eventInput.topic, this.eventLengthType, this.isFollowOn);
        const introSection: AgendaSection = await intro.createSection();
        const introTime: number = intro.getIntroLengthInMinutes();

        // community norms 
        const communityNorm: CommunityNormBuilder = new CommunityNormBuilder(this.eventInput.topic, this.isFollowOn, this.eventInput.goals[this.eventInput.goals.length - 1])
        const communityNormSection: AgendaSection = await communityNorm.createSection();
        const communityNormTime: number = communityNorm.getIntroLengthInMinutes();

        // conclusion
        const conclusionNorm: ConclusionBuilder = new ConclusionBuilder(this.eventInput.topic, this.eventLengthType, this.isFollowOn);
        const conclusionNormSection: AgendaSection = await conclusionNorm.createSection();
        const conclusionNormTime: number = conclusionNorm.getLengthInMinutes();

        // determine how long middle sections are 
        const middleSectionDuration: number = this._determineMiddleSectionTiming(introTime, communityNormTime, conclusionNormTime);

        // add sections
        this.agenda.addSection(introSection);
        this.agenda.addSection(communityNormSection);

        // add the middle sections 
        this._addMiddleSections(middleSectionDuration);

        for (let builder of this.middleSectionBuilders) {
            this.agenda.addSection(await builder.createSection());
            for (let i = 0; i < builder.warnings.length; i++) {
                this.warnings.push(builder.warnings[i]);
            }
        }

        this.agenda.addSection(conclusionNormSection);
    }

    _addMiddleSections(sectionDuration: number) {

        const totalSections: number = this.sectionList.sections.length;

        let sectionCounter = 0;
        while (sectionCounter < totalSections) {
            let currSection = this.sectionList.sections[sectionCounter];
            let nextSection = null;
            if (sectionCounter < (totalSections - 1)) {
                nextSection = this.sectionList.sections[sectionCounter + 1]
            }
            
            let duration = sectionDuration;

            // since we added main Goals in halves, we have to recombine them into a full
            if (currSection == nextSection) { 
                duration = sectionDuration * 2;
                sectionCounter = sectionCounter + 1; // if we skip the next one, then we need to record that it is added
            }

            // Now section checks 
            if (currSection == Goals.subDialogue) {
                this.middleSectionBuilders.push(new DialogueBuilder(this.eventInput.topic, false, duration, this.llmService));
            }
            if (currSection == Goals.subExploration) {
                this.middleSectionBuilders.push(new ExplorationBuilder(this.eventInput.topic, duration, false, this.eventInput.lowerParticipantCount, this.eventInput.upperParticipantCount, this.llmService, this.firstExploration));
            }
            if (currSection == Goals.dialogue) {
                let mainGoal: boolean = this.sectionList.sections.length == 1 ? true : false;
                this.middleSectionBuilders.push(new DialogueBuilder(this.eventInput.topic, mainGoal, duration, this.llmService));
            }
            if (currSection == Goals.exploration) {
                this.middleSectionBuilders.push(new ExplorationBuilder(this.eventInput.topic, duration, true, this.eventInput.lowerParticipantCount, this.eventInput.upperParticipantCount, this.llmService, this.firstExploration));
            }
            if (currSection == Goals.deliberation) {
                this.middleSectionBuilders.push(new DeliberationBuilder(this.eventInput.topic, this.eventInput.isConcreteDecision, duration));
            }

            sectionCounter = sectionCounter + 1;
        }
    }

    _determineMiddleSectionTiming(introTime: number, communityNormTime: number, conclusionNormTime: number): number {

        // How much time we have total for the middle sections
        const middleSectionsLength = this.agenda.duration.getMinutes() - (introTime + communityNormTime + conclusionNormTime);

        // divide that by how many sections we have to get each section's duration 
        const sectionDuration = Math.floor(middleSectionsLength / this.sectionList.sections.length);

        return sectionDuration;
    }
}




