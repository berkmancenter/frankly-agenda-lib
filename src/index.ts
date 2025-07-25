import { generateEventPlan } from './build_event_plan.js'
import agendaJson from './sample.json';

export { generateEventPlan } from './build_event_plan.js'


console.log(generateEventPlan(JSON.stringify(agendaJson)));