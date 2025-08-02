import { Agenda, createAgenda, EventPlan } from "./models/agenda_models.js";
import { EventInputs, EventSection } from "./models/input_models.js";
import { SectionBuilder } from "./section_controllers/section_builder.js";
import { Goals } from "./utils/global_enums.js";

export class AgendaBuilder {
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
