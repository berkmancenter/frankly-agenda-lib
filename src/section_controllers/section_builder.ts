import { Agenda, AgendaSection } from "../models/agenda_models.js";
import { EventInputs } from "../models/input_models.js";
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

    constructor(agenda: Agenda, eventInput: EventInputs) {
        this.agenda = agenda;
        this.eventInput = eventInput;
    }


    public buildStructure(): void {

        this.builders.push(new IntroductionBuilder(this.eventInput.topic));
        this.builders.push(new CommunityNormBuilder(this.eventInput.topic));

        // determine and add the sections based on goals
        this._addMiddleSections()

        this.builders.push(new ConclusionBuilder(this.eventInput.topic));


        for (let builder of this.builders) {
            this.agenda.addSection(builder.createSection());
        }
    }

    _addMiddleSections() {
        // dialogue section
        if (this.eventInput.goals.includes(Goals.dialogue) || this.eventInput.goals.includes(Goals.exploration) || this.eventInput.goals.includes(Goals.evaluation) || this.eventInput.goals.includes(Goals.deliberation)) {
            this.builders.push(new DialogueBuilder(this.eventInput.topic));
        }

        // exploration section 
        if (this.eventInput.goals.includes(Goals.exploration) || this.eventInput.goals.includes(Goals.evaluation) || this.eventInput.goals.includes(Goals.deliberation)) {
            this.builders.push(new ExplorationBuilder(this.eventInput.topic));
        }

        // evaluation section 
        if (this.eventInput.goals.includes(Goals.evaluation) || this.eventInput.goals.includes(Goals.deliberation)) {
            this.builders.push(new EvaluationBuilder(this.eventInput.topic, this.eventInput.isConcrete));
        }
    }
}




