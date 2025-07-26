import { Goals } from "../utils/global_enums";
import { CustomDuration } from "./agenda_models";

interface IEventInputs {
    goals: string[],
    topic: string,
    topicDescription?: string,
    audienceDescription: string,
    participantCount: string,
    participantsPerBreakoutGroup: number;
    hasBreakoutGroups: boolean,
    isFacilitated: boolean,
    isSeries: boolean,
    eventCount?: number,
    eventLength: Number,
    isConcreteDecision?: boolean
}

interface IEventSection {
    sections: Goals[],
}

export class EventInputs implements IEventInputs {
    goals: string[];
    topic: string;
    topicDescription?: string;
    audienceDescription: string;
    participantCount: string;
    upperParticipantCount: number;
    lowerParticipantCount: number;
    participantsPerBreakoutGroup: number;
    hasBreakoutGroups: boolean;
    isFacilitated: boolean;
    isSeries: boolean;
    eventCount?: number;
    eventLength: number;
    isConcreteDecision?: boolean;
}

export class EventSection implements IEventSection {
    sections: Goals[];

    constructor() {
        this.sections = [];
    }
}