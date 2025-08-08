import { z } from "zod";
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "@langchain/core/tools";
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
import { getLLMModel } from "./langchain_services.js";

// Schemas

// const RequiresTopicBackgroundFormatter = z.object({
//     answer: z.boolean().describe("Whether it is essential to provide a factual background in order to have a productive exploration of the topic at hand. For example, a conversation about climate change likely requires some basic facts. However, a conversation about God and religion is more focused on perspectives and human experience, and likely does not."),
//     explanation: z.string().describe("The rationale beind the answer. Keep it short and to the point."),

// });



// Classes 

// export class TopicBackgroundFormat {
//     answer: boolean;
//     explanation: string;
//     constructor(data: z.infer<typeof RequiresTopicBackgroundFormatter>) {
//         // Assign properties from the validated data
//         Object.assign(this, data);
//     }
// }



// export async function askLLMAboutBackgroundInfo(topic: string) {

//     const model = getLLMModel();

//     const query: string = "The user wants to explore " + topic + " in a constructive conversation with the goal of generating ideas, questions, and unknowns. Does an exploration of " + topic + " require background information, such as a set of facts with the purpose of generating a shared reality and creating a starting point for the conversation?"

//     // Bind the schema to the model
//     const modelWithStructure = model.withStructuredOutput(RequiresTopicBackgroundFormatter);
//     // Invoke the model
//     const aiMsg = await modelWithStructure.invoke(
//         query
//     );

//     console.log(aiMsg);

//     try {
//         const validatedMsg = RequiresTopicBackgroundFormatter.parse(aiMsg);
//         return new TopicBackgroundFormat(validatedMsg)
//     } catch (e) {
//         throw new CustomError(ErrorCategory.ParsingError, "Unable to parse exploration topic background response from LLM.", ErrorType.error, e);
//     }
// }

// export async function generateExplorationItemPrompts(topic: string): Promise<ExplorationPromptFormat> {
//     const model = getLLMModel();

//     const query: string = "The user wants to explore " + topic + " in a constructive conversation with the goal of generating ideas, questions, and unknowns. Generate a prompt that facilitates that."

//     // Bind the schema to the model
//     const modelWithStructure = model.withStructuredOutput(ExplorationPromptFormatter);
//     // Invoke the model
//     const aiMsg = await modelWithStructure.invoke(
//         query
//     );

//     console.log(aiMsg);

//     try {
//         const validatedMsg = ExplorationPromptFormatter.parse(aiMsg);
//         return new ExplorationPromptFormat(validatedMsg)
//     } catch (e) {
//         throw new CustomError(ErrorCategory.ParsingError, "Unable to parse exploration prompt response from LLM.", ErrorType.error, e);
//     }
// }