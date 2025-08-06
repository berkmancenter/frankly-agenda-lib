import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { z } from "zod";

// Background Formatters
export const RequiresTopicBackgroundFormatter = z.object({
    answer: z.boolean().describe("Whether it is essential to provide a factual background in order to have a productive exploration of the topic at hand. For example, a conversation about climate change likely requires some basic facts. However, a conversation about God and religion is more focused on perspectives and human experience, and likely does not."),
    explanation: z.string().describe("The rationale beind the answer. Keep it short and to the point."),

});
export class TopicBackgroundFormat {
    answer: boolean;
    explanation: string;
    constructor(data: z.infer<typeof RequiresTopicBackgroundFormatter>) {
        // Assign properties from the validated data
        Object.assign(this, data);
    }
}

export const StructuredOutputGraphAnnotation = Annotation.Root({
    structured_response: Annotation<string>(),
    // Spread `MessagesAnnotation` into the state to add the `messages` field.
    ...MessagesAnnotation.spec,
});