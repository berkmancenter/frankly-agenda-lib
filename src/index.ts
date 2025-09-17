import dotenv from 'dotenv';
import { testEventGeneratorLocal } from './test.js';
dotenv.config();

export { generateEventPlan } from './build_event_plan.js'

await testEventGeneratorLocal();