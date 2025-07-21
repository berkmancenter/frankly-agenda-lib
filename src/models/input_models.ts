import { Goals } from "../utils/global_enums";

interface IEventInputs {
    goals: string[],
    topic: string,
    topicDescription?: string,
    audienceDescription: string,
    participantCount: string,
    hasBreakoutGroups: boolean,
    isFacilitated: boolean,
    isSeries: boolean,
    eventCount?: number,
    eventLength: Number,
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
    hasBreakoutGroups: boolean;
    isFacilitated: boolean;
    isSeries: boolean;
    eventCount?: number;
    eventLength: number;
    isConcrete?: boolean;
}

export class EventSection implements IEventSection {
    sections: Goals[];
    constructor() {
        this.sections = [];
    }
}