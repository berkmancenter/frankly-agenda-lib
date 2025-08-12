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


    warnings: CustomError[] = [];


    isFollowOn: boolean;

    constructor(agenda: Agenda, eventInput: EventInputs, sectionList: EventSection, llmService: LangChainLLMService) {
        this.agenda = agenda;
        this.eventInput = eventInput;
        this.sectionList = sectionList;
        this.agenda.addDuration(this.eventInput.eventLength);
        this.isFollowOn = this.eventInput.isSeries == true && this.agenda.eventNumber > 0;
        this.llmService = llmService;
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
        const conclusionNormTime: number = conclusionNorm.getIntroLengthInMinutes();

        // determine how long middle sections are 
        const middleSectionDuration: CustomDuration = this._determineMiddleSectionTiming(introTime, communityNormTime, conclusionNormTime);

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

    _addMiddleSections(sectionDuration: CustomDuration) {

        const totalSections: number = this.sectionList.sections.length;

        const newDuration: number = this.agenda.duration.calculateSubDuration(totalSections);

        for (let i = 0; i < totalSections; i++) {
            let section = this.sectionList.sections[i];
            if (section == Goals.dialogue) {
                let mainGoal: boolean = this.sectionList.sections.length == 1 ? true : false;
                this.middleSectionBuilders.push(new DialogueBuilder(this.eventInput.topic, mainGoal, sectionDuration));
            }
            if (section == Goals.exploration) {
                this.middleSectionBuilders.push(new ExplorationBuilder(this.eventInput.topic, sectionDuration, this.eventInput.lowerParticipantCount, this.eventInput.upperParticipantCount, this.llmService));
            }
            if (section == Goals.deliberation) {
                this.middleSectionBuilders.push(new DeliberationBuilder(this.eventInput.topic, this.eventInput.isConcreteDecision));
            }
        }
    }

    _determineMiddleSectionTiming(introTime: number, communityNormTime: number, conclusionNormTime: number): CustomDuration {

        const middleSectionsLength = this.agenda.duration.getMinutes() - (introTime + communityNormTime + conclusionNormTime);

        const individualSectionLength = Math.floor(middleSectionsLength / this.sectionList.sections.length)

        const sectionDuration: CustomDuration = createDurationByTimeUnit({ minutes: individualSectionLength });

        return sectionDuration;
    }
}




