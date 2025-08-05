import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { HumanMessage } from "@langchain/core/messages";

export async function callLLM(text: string) {
    process.env.LANGCHAIN_TRACING_V2 = "false";
    process.env.LANGCHAIN_API_KEY = "";
    const custom_base_url = process.env.OPENAI_BASE_URL;
    const model = new ChatOpenAI({
        model: "gpt-4o-mini", configuration: {
            baseURL: custom_base_url,
            apiKey: process.env.OPENAI_API_KEY
        },
    });

    console.log("test updates with disabled langsmith");

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", "Return a short paragraph on the user's selected topic."],
        ["human", "Tell me about george washington"]
    ]);
    const chain = RunnableSequence.from([promptTemplate, model, new StringOutputParser()])

    const output = await chain.invoke({ text })
    console.log(output)
    return output;
}







