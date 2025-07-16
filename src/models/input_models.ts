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