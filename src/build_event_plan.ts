import { AgendaBuilder } from './agenda_builder.js';
import { EventPlan } from './models/agenda_models.js'
import { EventInputs } from './models/input_models.js'
import { Goals } from "./utils/global_enums.js";

export function generateEventPlan(eventJsonString: string): string {

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
  } else if (eventInput.goals.includes(Goals.deliberation)) {
    if (eventInput.isConcreteDecision == null) {
      errorMessages.push("If deliberation is a goal, user must specify if they want a concrete decision.");
    }
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
  if (eventInput.participantCount != 'zeroToFive') {
    if (eventInput.hasBreakoutGroups == null) {
      errorMessages.push("Event breakout group information is required for participant counts over five.")
    } else if (typeof eventInput.hasBreakoutGroups !== 'boolean') {
      errorMessages.push("Event breakout group information must be a boolean.")
    }
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









