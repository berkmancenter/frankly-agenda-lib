import { Agenda, createAgenda, EventPlan } from "./models/agenda_models.js";
import { EventInputs, EventSection } from "./models/input_models.js";
import { SectionBuilder } from "./section_controllers/section_builder.js";
import { LangChainLLMService } from "./services/langchain_services.js";
import { Goals } from "./utils/global_enums.js";
import { CustomError, ErrorCategory, ErrorType } from "./utils/result_handling.js";

export class AgendaBuilder {
  eventInput: EventInputs;
  eventPlan: EventPlan;
  eventName: string;
  llmService: LangChainLLMService;

  constructor(eventInput: EventInputs, llmService: LangChainLLMService) {
    this.eventInput = eventInput;
    let eventGoal = this.eventInput.goals[this.eventInput.goals.length - 1];
    this.eventName = this.eventInput.topic + " " + eventGoal.charAt(0).toUpperCase() + eventGoal.slice(1).toLowerCase();;
    this.llmService = llmService;
  }

  ///
  // Creates the agenda 
  ///
  async createAgendaPlan(): Promise<EventPlan> {

    this.eventPlan = new EventPlan(this.eventName, this.eventInput.topicDescription, true);

    const agendaList: Agenda[] = [];
    let eventCount = this.eventInput.eventCount;
    if (!this.eventInput.isSeries) {
      eventCount = 1;
    }
    let eventSections: EventSection[] = [];

    try {
      eventSections = this._getEventSections(eventCount, this.eventInput.goals);
    } catch (e) {
      throw new CustomError(ErrorCategory.ParsingError, "Error building agenda sections.", ErrorType.error, e);
    }

    // Create agendas 
    if (this.eventInput.isSeries) {
      for (var i = 0; i < this.eventInput.eventCount; i++) {
        // TODO: input whatever is needed to determine agenda characteristics 
        agendaList.push(createAgenda({ eventNumber: i }));
      }
    } else {
      agendaList.push(createAgenda({}));
    }

    for (let i = 0; i < agendaList.length; i++) {
      const builder: SectionBuilder = new SectionBuilder(agendaList[i], this.eventInput, eventSections[i], this.llmService);
      await builder.buildStructure();
      for (let j = 0; j < builder.warnings.length; j++) {
        this.eventPlan.warnings.push(builder.warnings[j]);
      }
      this.eventPlan.addAgendas(agendaList[i]);
    }

    return this.eventPlan;
  }

  ///
  // Convert raw numbers to actual goals 
  ///
  _getEventSections(eventCount: number, goals: String[]): EventSection[] {
    let eventSections: EventSection[] = [];
    const goalsArray: Goals[] = []; // all goals, including subgoals

    // We push all main goals twice, so that they have two half sections
    // which equals one full section 
    // because they should be twice as long as subsections
    // dialogue section
    if (goals.includes(Goals.dialogue)) {
      goalsArray.push(Goals.dialogue);
      goalsArray.push(Goals.dialogue);
    } else if (goals.includes(Goals.exploration) || goals.includes(Goals.deliberation)) {
      goalsArray.push(Goals.subDialogue);
    }
    // exploration section 
    if (goals.includes(Goals.exploration)) {
      goalsArray.push(Goals.exploration);
      goalsArray.push(Goals.exploration);
    } else if (goals.includes(Goals.deliberation)) {
      goalsArray.push(Goals.subExploration);
    }

    // deliberation section 
    if (goals.includes(Goals.deliberation)) {
      goalsArray.push(Goals.deliberation);
      goalsArray.push(Goals.deliberation);
    }

    const eventSectionsRaw: Object[][] = this._calculateSectionsPerEvent(eventCount, goalsArray);


    for (let i = 0; i < eventSectionsRaw.length; i++) {
      const event = new EventSection();
      for (let j = 0; j < eventSectionsRaw[i].length; j++) {
        event.sections.push(eventSectionsRaw[i][j] as Goals);
      }
      eventSections.push(event);
    }

    return eventSections;
  }

  ///
  // Calculate raw numbers for sections per event etc
  ///
  _calculateSectionsPerEvent(eventCount: number, sectionArray: Goals[]): Object[][] {
    let eventList: Object[][] = [];

    // subsections weren't asked for by the user, so they are shorter
    // they should each be about 1/2 the time of a regular section
    // i.e. Deliberation + subDialogue + subExploration = 2
    // i.e. Deliberation + Exploration  + subDialogue = 2.5 
    let totalHalfSections = sectionArray.length;
    const halfSectionsPerEventDecimal: number = (totalHalfSections) / eventCount;

    if (halfSectionsPerEventDecimal < 1) {
      // more events than sections, so we have each section repeat in multiple events 
      const halfEventsPerSection: number = Math.floor(eventCount / totalHalfSections);
      let leftOverEvents: number = eventCount % totalHalfSections;
      let tempHalfEventPerSection = halfEventsPerSection;


      const leftOverEventIncrement: number = Math.ceil(eventCount / leftOverEvents)

      let halfEventsAdded: number = 0;
      let sectionAdding: number = 0;
      let eventCounter = 0;
      for (let i = 0; i < eventCount; i++) {
        if ((i > 0 && i % leftOverEventIncrement == 0) ||
          (eventCount - 1 == i && leftOverEvents > 0)) { // leftoverevent spot 
          // the last events are where we want to add the extra sections, i.e. an extra event per section
          tempHalfEventPerSection = tempHalfEventPerSection + 1; // temporarily increase how many events have that section to use the leftover event
          leftOverEvents = leftOverEvents - 1;
        }
        if (halfEventsAdded >= tempHalfEventPerSection) {
          // added all events for that section, move to the next section
          sectionAdding = sectionAdding + 1;
          halfEventsAdded = 0;
          tempHalfEventPerSection = halfEventsPerSection;
        }
        eventList[i] = [sectionArray[sectionAdding]];
        halfEventsAdded = halfEventsAdded + 1;
      }
    } else {
      const halfSectionsPerEvent: number = Math.floor(totalHalfSections / eventCount);
      const leftOverSections: number = totalHalfSections % eventCount;
      let sectionAdding: number = 0;
      for (let i = 0; i < eventCount; i++) {
        eventList[i] = [];
        for (let j = 0; j < halfSectionsPerEvent; j++) {
          eventList[i].push(sectionArray[sectionAdding]);
          sectionAdding = sectionAdding + 1;
        }
        if (i < leftOverSections) {
          eventList[i].push(sectionArray[sectionAdding]);
          sectionAdding = sectionAdding + 1;
        }
      }
    }
    console.log(eventList)
    return eventList;
  }

}
