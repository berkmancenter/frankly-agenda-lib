import { Agenda, AgendaSection } from "../models/agenda_models.js";
import { EventInputs, EventSection } from "../models/input_models.js";
import { CommunityNormBuilder } from "./community_norm_builder.js";
import { DialogueBuilder } from "./dialogue_builder.js";
import { EvaluationBuilder } from "./evaluation_builder.js";
import { ExplorationBuilder } from "./exploration_builder.js";
import { IntroductionBuilder } from "./introduction_builder.js";
import { Goals } from "../utils/global_enums.js";
import { ConclusionBuilder } from "./conclusion_builder.js";

export interface ISectionBuilder {
    topic: string;
    createSection(): AgendaSection;
}

export class SectionBuilder {
    agenda: Agenda;
    eventInput: EventInputs;
    builders: ISectionBuilder[] = [];
    sectionList: EventSection;

    constructor(agenda: Agenda, eventInput: EventInputs, sectionList: EventSection) {
        this.agenda = agenda;
        this.eventInput = eventInput;
        this.sectionList = sectionList;
    }

    public buildStructure(): void {

        this.builders.push(new IntroductionBuilder(this.eventInput.topic));
        this.builders.push(new CommunityNormBuilder(this.eventInput.topic));

        // add the sections 
        this._addMiddleSections();

        this.builders.push(new ConclusionBuilder(this.eventInput.topic));

        for (let builder of this.builders) {
            this.agenda.addSection(builder.createSection());
        }
    }

    _addMiddleSections() {
        for (let i = 0; i < this.sectionList.sections.length; i++) {
            let section = this.sectionList.sections[i];
            if (section == Goals.dialogue) {
                this.builders.push(new DialogueBuilder(this.eventInput.topic));
            }
            if (section == Goals.exploration) {
                this.builders.push(new ExplorationBuilder(this.eventInput.topic));
            }
            if (section == Goals.deliberation) {
                this.builders.push(new EvaluationBuilder(this.eventInput.topic, this.eventInput.isConcrete));
            }
        }
    }
}




