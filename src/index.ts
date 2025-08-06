import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { generateEventPlan } from './build_event_plan.js';
import dotenv from 'dotenv';
dotenv.config();

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(join(__dirname, 'sample.json'), 'utf-8'));

export { generateEventPlan } from './build_event_plan.js'

console.log(generateEventPlan(JSON.stringify(sample)));
// console.log(generateEventPlan("BAD JSON"));

//console.log(generateText());


// console.log(generateEventPlan("hi"));
// console.log(generateText("Tell me a fun fact about Harvard.")
//   .catch(err => console.error("Error:", err)));