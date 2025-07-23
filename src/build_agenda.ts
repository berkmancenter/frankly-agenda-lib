import { SectionBuilder } from './section_controllers/section_builder.js';
import { Agenda, createAgenda, EventPlan } from './models/agenda_models.js'
import { EventInputs, EventSection } from './models/input_models.js'
import { Goals } from "./utils/global_enums.js";


export function generateAgenda(eventJsonString: string) {

  ///
  // 1. Parse input 
  // 2. Based on input, generate structure
  // 3. Based on structure, gather content
  // 4. Add it all to the agenda 
  ///

  // Parse input
  const eventInputs: EventInputs = _parseEventInput(eventJsonString);

  // Agenda builder 
  const agendaBuilder: AgendaBuilder = new AgendaBuilder(eventInputs);

  // Create new agendas
  const eventPlan: EventPlan = agendaBuilder.createAgendaPlan();

  return JSON.stringify(eventPlan);
}

///
// parses the JSON input and returns an EventInputs object
// EventsInput is validated and typesafe
///
function _parseEventInput(eventJsonString: string): EventInputs {
  let event: EventInputs = null;
  try {
    event = JSON.parse(eventJsonString) as EventInputs;
  } catch (e) {
    //TODO: Create error class 
    console.log("Parsing error" + e);
    throw Error("Parsing error!!");
  }

  // TODO: any other error checking on JSON
  let errors: string[] = _validateEvent(event);

  if (errors.length === 0) {
    return event;
  } else {
    // TODO: update to use error class 
    console.log(errors);
    throw Error("Missing information!!");
  }
}

///
// Validates that all required fields are present and properly typed
// Event should be typesafe after this function 
///
function _validateEvent(eventInput: EventInputs): string[] {
  let errorMessages: string[] = [];

  // goal validation 
  if (eventInput.goals == null) {
    errorMessages.push("Event goals are required.")
  } else if (Array.isArray(eventInput.goals) && eventInput.goals.length > 0 && !(typeof eventInput.goals[0] === 'string')) {
    errorMessages.push("Event goals must be an array of strings.");
  } else if (!eventInput.goals.includes(Goals.deliberation)) {
    errorMessages.push("If deliberation is a goal, user must specify if they want a concrete decision.");
  }

  // topic validation 
  if (eventInput.topic == null) {
    errorMessages.push("Event topic is required.")
  } else if (typeof eventInput.topic !== 'string') {
    errorMessages.push("Event topic must be a string.")
  }

  // audience validation 
  if (eventInput.audienceDescription == null) {
    errorMessages.push("Event audience description is required.")
  } else if (typeof eventInput.topic !== 'string') {
    errorMessages.push("Event audience description must be a string.")
  }

  // participantCount validation 
  if (eventInput.participantCount == null) {
    errorMessages.push("Event participant count is required.")
  } else if (typeof eventInput.topic !== 'string') {
    errorMessages.push("Event participation count must be a string.")
  }

  // breakoutGroup validation 
  if (eventInput.hasBreakoutGroups == null) {
    errorMessages.push("Event breakout group information is required.")
  } else if (typeof eventInput.hasBreakoutGroups !== 'boolean') {
    errorMessages.push("Event breakout group information must be a boolean.")
  }

  // facilitation validation 
  if (eventInput.isFacilitated == null) {
    errorMessages.push("Event facilitation information is required.")
  } else if (typeof eventInput.isFacilitated !== 'boolean') {
    errorMessages.push("Event facilitation information must be a boolean.")
  }

  // series validation 
  if (eventInput.isSeries == null) {
    errorMessages.push("Event series information is required.")
  }
  else if (typeof eventInput.isSeries !== "boolean") {
    errorMessages.push("Event series information must be a boolean.")
  }
  else if (eventInput.isSeries) {
    if (eventInput.eventCount == null || typeof eventInput.eventLength !== 'number') {
      errorMessages.push("Event count is a required number if event is a series.")
    }
  }

  if (eventInput.eventLength == null) {
    errorMessages.push("Event length is required.")
  } else if (typeof eventInput.eventLength !== 'number') {
    errorMessages.push("Event length must be a number.")
  }

  return errorMessages;
}

class AgendaBuilder {
  eventInput: EventInputs;
  eventPlan: EventPlan;
  agendaName: string;

  constructor(eventInput: EventInputs) {
    this.eventInput = eventInput;
    this.agendaName = this.eventInput.topic + " Agenda";
  }

  ///
  // Creates the agenda 
  ///
  createAgendaPlan(): EventPlan {

    this.eventPlan = new EventPlan(this.agendaName, this.eventInput.topicDescription, true);

    const agendaList: Agenda[] = [];
    const eventSections: EventSection[] = this._getEventSections(this.eventInput.eventCount, this.eventInput.goals);

    // Create agendas 
    if (this.eventInput.isSeries) {
      for (var i = 0; i < this.eventInput.eventCount; i++) {
        // TODO: input whatever is needed to determine agenda characteristics 
        const newName: string = name + " One";
        agendaList.push(createAgenda({ eventNumber: i }));
      }
    } else {
      agendaList.push(createAgenda({}));
    }

    for (let i = 0; i < agendaList.length; i++) {
      const builder: SectionBuilder = new SectionBuilder(agendaList[i], this.eventInput, eventSections[i]);
      builder.buildStructure();
      this.eventPlan.addAgendas(agendaList[i]);
    }

    return this.eventPlan;
  }

  ///
  // Convert raw numbers to actual goals 
  ///
  _getEventSections(eventCount: number, goals: String[]): EventSection[] {
    let eventSections: EventSection[] = [];
    const goalsArray: Goals[] = [];

    // dialogue section
    if (goals.includes(Goals.dialogue) || goals.includes(Goals.exploration) || goals.includes(Goals.deliberation)) {
      goalsArray.push(Goals.dialogue);
    }
    // exploration section 
    if (goals.includes(Goals.exploration) || goals.includes(Goals.deliberation)) {
      goalsArray.push(Goals.exploration);
    }

    // deliberation section 
    if (goals.includes(Goals.deliberation)) {
      console.log("getting deliberation")
      goalsArray.push(Goals.deliberation);
    }

    const eventSectionsRaw: number[][] = this._calculateSectionsPerEvent(eventCount, goalsArray.length);

    for (let i = 0; i < eventSectionsRaw.length; i++) {
      const event = new EventSection();
      for (let j = 0; j < eventSectionsRaw[i].length; j++) {
        event.sections.push(goalsArray[eventSectionsRaw[i][j] - 1]);
      }
      eventSections.push(event);
    }
    return eventSections;
  }

  ///
  // Calculate raw numbers for sections per event etc
  ///
  _calculateSectionsPerEvent(eventCount: number, totalSections: number): number[][] {
    let eventList: number[][] = [];
    const sectionsPerEventDecimal: number = totalSections / eventCount;

    if (sectionsPerEventDecimal < 1) {
      // more events than sections 
      const eventsPerSection: number = Math.floor(eventCount / totalSections);
      const leftOverEvents: number = eventCount % totalSections;

      let eventsAdded: number = 0;
      let sectionAdding: number = 1;
      for (let i = 0; i < eventCount; i++) {
        let tempEventPerSection = eventsPerSection;
        if (totalSections - sectionAdding < leftOverEvents) {
          // the last events are where we want to add the extra sections, i.e. an extra event per section
          tempEventPerSection = eventsPerSection + 1;
        }
        if (eventsAdded >= tempEventPerSection) {
          sectionAdding = sectionAdding + 1;
          eventsAdded = 0;
        }
        eventList[i] = [sectionAdding];
        eventsAdded = eventsAdded + 1;
      }
    } else {
      const sectionsPerEvent: number = Math.floor(totalSections / eventCount);
      const leftOverSections: number = totalSections % eventCount;
      let sectionAdding: number = 1;
      for (let i = 0; i < eventCount; i++) {
        eventList[i] = [];
        for (let j = 0; j < sectionsPerEvent; j++) {
          eventList[i].push(sectionAdding);
          sectionAdding = sectionAdding + 1;
        }
        if (i < leftOverSections) {
          eventList[i].push(sectionAdding);
          sectionAdding = sectionAdding + 1;
        }
      }
    }
    console.log(eventList)
    return eventList;
  }

}









