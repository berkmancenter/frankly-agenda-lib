interface IEventPlan {
    eventName: string,
    eventDescription: string,
    isSeries: boolean,
    agendas: Agenda[]
}

interface IAgenda {
    sections: IAgendaSection[]
    eventNumber?: number[], // which event(s) in a series of events 
    additionalInformation?: IAgendaItem[] // Additional information, i.e. best practices for facilitators
}

interface IAgendaSection {
    name: string,
    description: string,
    items: AgendaItem[]
}

interface IAgendaItem {
    title: string,
    content: string[],
    duration?: Duration,
    importance?: string[]
    guidance?: string[];
}

interface IDuration {
    hours?: number,
    minutes?: number,
    seconds?: number
}

export class EventPlan implements IEventPlan {
    eventName: string;
    eventDescription: string;
    isSeries: boolean;
    agendas: Agenda[];

    constructor(eventName: string, eventDescription: string, isSeries: boolean, eventNumber?: number[], additionalInformation?: AgendaItem[]) {
        this.eventName = eventName;
        this.eventDescription = eventDescription;
        this.isSeries = isSeries;
        this.agendas = [];
    }

    addAgendas(agenda: Agenda): void {
        this.agendas.push(agenda)
    }
}

export class Agenda implements IAgenda {
    sections: AgendaSection[];
    eventNumber?: number[]; // which event(s) in a series of events 
    additionalInformation?: AgendaItem[];

    constructor(eventNumber?: number[], additionalInformation?: AgendaItem[]) {
        this.sections = [];
        this.eventNumber = eventNumber;
        this.additionalInformation = additionalInformation;
    }

    addSection(item: AgendaSection): void {
        this.sections.push(item);
    }
}

export class AgendaSection implements IAgendaSection {
    name: string;
    description: string;
    items: AgendaItem[];

    constructor(name: string, description: string) {
        this.name = name;
        this.description = description;
        this.items = [];
    }

    addItem(item: AgendaItem): void {
        this.items.push(item);
    }
}

export class AgendaItem implements IAgendaItem {
    title: string;
    content: string[];
    duration?: Duration;
    importance?: string[];
    guidance?: string[];

    constructor(title: string, content: string[], duration?: Duration, importance?: string[], guidance?: string[]) {
        this.title = title;
        this.content = content;
        this.duration = duration;
        this.importance = importance;
        this.guidance = guidance;
    }
}

class Duration implements IDuration {
    hours?: number;
    minutes?: number;
    seconds?: number;

    constructor() {
    }
}

export function createAgenda({eventNumber = null, additionalInformation = null }): Agenda {
    const newAgenda = new Agenda();

    newAgenda.eventNumber = eventNumber;
    newAgenda.additionalInformation = additionalInformation;

    return newAgenda;
}

export function createDuration({ hours = 0, minutes = 0, seconds = 0 }): Duration {
    const newDuration = new Duration();

    newDuration.hours = hours;
    newDuration.minutes = minutes;
    newDuration.seconds = seconds;

    return newDuration;
}