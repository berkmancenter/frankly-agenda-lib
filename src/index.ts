import { generateAgenda } from './build_agenda.js'
import agendaJson from './sample.json';

export { generateAgenda } from './build_agenda.js'


console.log(generateAgenda(JSON.stringify(agendaJson)));