import { SectionBuilder } from './section_controllers/section_builder.js';
import { Agenda, createAgenda, EventPlan } from './models/agenda_models.js'
import { EventInputs } from './models/input_models.js'
import { Goals } from "./utils/global_enums.js";


export function generateAgenda(eventJsonString: string) {

  ///
  // 1. Parse input 
  // 2. Based on input, generate structure
  // 3. Based on structure, gather content
  // 4. Add it all to the agenda 
  ///

  // Parse and validate event input
  const eventInput: EventInputs = _parseEventInput(eventJsonString);
  const agendaName: string = eventInput.topic + " Agenda";

  // Create new agenda
  const eventPlan: EventPlan = _createAgenda(agendaName, eventInput);

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
// Creates the agenda 
///
function _createAgenda(name: string, eventInput: EventInputs): EventPlan {

  const eventPlan: EventPlan = new EventPlan(name, eventInput.topicDescription, true);

  const agendaList: Agenda[] = [];

  // Create agendas 
  if (eventInput.isSeries) {
    for (var i = 0; i < eventInput.eventCount; i++) {
      // TODO: input whatever is needed to determine agenda characteristics 
      const newName: string = name + " One";
      agendaList.push(createAgenda({eventNumber: i }));
    }
  } else {
    agendaList.push(createAgenda({}));
  }

  // build out agendas
  for (let agenda of agendaList) {
    const builder: SectionBuilder = new SectionBuilder(agenda, eventInput);
    builder.buildStructure();
    eventPlan.addAgendas(agenda);
  }
  return eventPlan;
}

///
// Validates that all required fields are present and properly typed
// Event should be typesafe after this function 
///
function _validateEvent(event: EventInputs): string[] {
  let errorMessages: string[] = [];

  // goal validation 
  if (event.goals == null) {
    errorMessages.push("Event goals are required.")
  } else if (Array.isArray(event.goals) && event.goals.length > 0 && !(typeof event.goals[0] === 'string')) {
    errorMessages.push("Event goals must be an array of strings.");
  } else if (!event.goals.includes(Goals.evaluation)) {
    errorMessages.push("If evaluation is a goal, user must specify if they want a concrete decision.");
  }

  // topic validation 
  if (event.topic == null) {
    errorMessages.push("Event topic is required.")
  } else if (typeof event.topic !== 'string') {
    errorMessages.push("Event topic must be a string.")
  }

  // audience validation 
  if (event.audienceDescription == null) {
    errorMessages.push("Event audience description is required.")
  } else if (typeof event.topic !== 'string') {
    errorMessages.push("Event audience description must be a string.")
  }

  // participantCount validation 
  if (event.participantCount == null) {
    errorMessages.push("Event participant count is required.")
  } else if (typeof event.topic !== 'string') {
    errorMessages.push("Event participation count must be a string.")
  }

  // breakoutGroup validation 
  if (event.hasBreakoutGroups == null) {
    errorMessages.push("Event breakout group information is required.")
  } else if (typeof event.hasBreakoutGroups !== 'boolean') {
    errorMessages.push("Event breakout group information must be a boolean.")
  }

  // facilitation validation 
  if (event.isFacilitated == null) {
    errorMessages.push("Event facilitation information is required.")
  } else if (typeof event.isFacilitated !== 'boolean') {
    errorMessages.push("Event facilitation information must be a boolean.")
  }

  // series validation 
  if (event.isSeries == null) {
    errorMessages.push("Event series information is required.")
  }
  else if (typeof event.isSeries !== "boolean") {
    errorMessages.push("Event series information must be a boolean.")
  }
  else if (event.isSeries) {
    if (event.eventCount == null || typeof event.eventLength !== 'number') {
      errorMessages.push("Event count is a required number if event is a series.")
    }
  }

  if (event.eventLength == null) {
    errorMessages.push("Event length is required.")
  } else if (typeof event.eventLength !== 'number') {
    errorMessages.push("Event length must be a number.")
  }

  return errorMessages;
}


