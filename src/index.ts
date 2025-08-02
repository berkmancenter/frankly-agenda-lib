import { generateEventPlan } from './build_event_plan.js'

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sample = JSON.parse(readFileSync(join(__dirname, 'sample.json'), 'utf-8'));

export { generateEventPlan } from './build_event_plan.js'

// console.log(generateEventPlan(JSON.stringify(sample)));