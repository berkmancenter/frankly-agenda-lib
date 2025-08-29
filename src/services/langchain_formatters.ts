import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";


export enum StructureType { explorationTopicBackground, explorationPrompt }

// Basic structure

export const StructuredOutputGraphAnnotation = Annotation.Root({
    structured_response: Annotation<string>(),
    // Spread `MessagesAnnotation` into the state to add the `messages` field.
    ...MessagesAnnotation.spec,
});

// Exploration Topic Background Formatters
export const RequiresTopicBackgroundFormatter = z.object({
    answer: z.boolean().describe("Whether it is essential to provide a factual background in order to have a productive exploration of the topic at hand. For example, a conversation about climate change likely requires some basic facts. However, a conversation about God and religion is more focused on perspectives and human experience, and likely does not."),
    explanation: z.string().describe("The rationale behind the answer. Keep it short and to the point, but make sure it is specific as to why this particular topic requires background information."),

});
export class TopicBackgroundFormat {
    answer: boolean;
    explanation: string;
    constructor(data: z.infer<typeof RequiresTopicBackgroundFormatter>) {
        // Assign properties from the validated data
        Object.assign(this, data);
    }
}

// Exploration Item Formatters

export const ExplorationPromptFormatter = z.object({
    prompt: z.string().describe("A prompt that provokes exploration of a certain topic. This prompt will be part of a discussion designed to generate ideas, questions, and unknowns about a topic. The topic should be unbiased and nonpartisan. It should be designed just to prompt people to discuss and explore, but not bias them in any way."),
    explanation: z.string().describe("The rationale behind how this particular prompt achieves these goals."),
});

export class ExplorationPromptFormat {
    prompt: string;
    explanation: string;
    constructor(data: z.infer<typeof ExplorationPromptFormatter>) {
        // Assign properties from the validated data
        Object.assign(this, data);
    }
}