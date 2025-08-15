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
      for (let i = 0; i < builder.warnings.length; i++) {
        this.eventPlan.warnings.push(builder.warnings[i]);
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
