import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { StringOutputParser } from '@langchain/core/output_parsers'
import { RunnableSequence } from '@langchain/core/runnables'
import { v4 as uuidv4 } from "uuid";
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
    Annotation,
} from "@langchain/langgraph"
import { UUID } from "crypto";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { RequiresTopicBackgroundFormatter, StructuredOutputGraphAnnotation, TopicBackgroundFormat } from "./langchain_formatters.js";

export class LangChainLLMService {
    llm: ChatOpenAI;
    threadID: string;

    workflow;
    memory: MemorySaver;
    app;
    config: object;
    app2;
    app3;
    structuredOutputResp;

    constructor() {
        this.llm = this._getLLMModel();
        this.threadID = uuidv4();
        this._setUpState();
        this._createLLMApp();
        //this._createDifferentLLMApp();
    }

    _getLLMModel() {
        return new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0,
        });
    }

    async testMemory() {
        // const input = [
        //     {
        //         role: "user",
        //         content: "Tell me about the dude that wrote a book about memory.",
        //     },
        // ];

        // const output = await this.app.invoke({ messages: input }, this.config);
        // console.log(output.messages[output.messages.length - 1]);
        //this.testMemory2();
        // this.askLLMAboutBackgroundInfo("climate change");
    }

    async testMemory2() {
        console.log("\nn\nIn test memory 2")
        const input = [
            {
                role: "user",
                content: "That author, when was he born?",
            },
        ];

        const output = await this.app.invoke({ messages: input }, this.config);
        console.log(output.messages[output.messages.length - 1]);

        this.testpromptTemplate();
    }

    // function that calls the model
    _callModel = async (state: typeof MessagesAnnotation.State) => {
        const response = await this.llm.invoke(state.messages);
        // Update message history with response:
        return { messages: response };
    };

    _setUpState() {
        // new graph
        this.workflow = new StateGraph(MessagesAnnotation)
            // node in the graph
            .addNode("model", this._callModel)
            .addEdge(START, "model")
            .addEdge("model", END);

        // Add memory
        this.memory = new MemorySaver();
        this.app = this.workflow.compile({ checkpointer: this.memory });

        this.config = { configurable: { thread_id: this.threadID } };
    }

    async askLLMAboutBackgroundInfo(humanQuery: string): Promise<TopicBackgroundFormat> {

        // bind schema to the model
        const modelWithStructure = this.llm.withStructuredOutput(RequiresTopicBackgroundFormatter);

        // the function that calls the model
        const callStructuredModel = async (state: typeof StructuredOutputGraphAnnotation.State) => {
            const response = await modelWithStructure.invoke(state.messages);
            const message = new AIMessage(JSON.stringify(response));
            return {
                messages: [message],
                structured_response: response,
            };
        };

        const structuredOutputWorkflow = new StateGraph(MessagesAnnotation)
            // node in the graph
            .addNode("model", callStructuredModel)
            .addEdge(START, "model")
            .addEdge("model", END);

        const structuredOutputApp = structuredOutputWorkflow.compile({ checkpointer: this.memory });



        this.structuredOutputResp = await structuredOutputApp.invoke({
            messages: [
                new HumanMessage(humanQuery)
            ]
        }, this.config);

        const message = JSON.parse(this.structuredOutputResp["messages"][1]["content"]);
        const validatedMessage = RequiresTopicBackgroundFormatter.parse(message);
        const finalClass = new TopicBackgroundFormat(validatedMessage);
        console.log(finalClass);
        return finalClass;
        //this.testpromptTemplateOTHER_checkold();
    }

    async testpromptTemplateOTHER() {

    }

    async testpromptTemplate() {
        console.log("\n\n IN TEST PROMPT TEMPLATE ")

        // const config3 = { configurable: { thread_id: uuidv4() } };
        const input4 = [
            {
                role: "user",
                content: "Tell me about the dude that wrote a book about memory.",
            },
        ];
        const output4 = await this.app2.invoke(input4, this.config);
        console.log(output4.messages[output4.messages.length - 1]);
        this.testpromptTemplate2();
    }

    _createLLMApp() {
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", "You are a {adjective} old man. You were an NCO in the army for 20 years and achieved the rank of master sergeant. act as such.."],
            new MessagesPlaceholder("messages"),
        ]);

        // the State
        const GraphAnnotation = Annotation.Root({
            adjective: Annotation<string>(),
            // Spread `MessagesAnnotation` into the state to add the `messages` field.
            ...MessagesAnnotation.spec,
        });
        const runnable = prompt.pipe(this.llm);
        // the function that calls the model
        const callModel2 = async (state: typeof GraphAnnotation.State) => {
            const response = await runnable.invoke(state);
            // Update message history with response:
            return { messages: [response] };
        };

        const workflow2 = new StateGraph(GraphAnnotation)
            .addNode("model", callModel2)
            .addEdge(START, "model")
            .addEdge("model", END);

        this.app2 = workflow2.compile({ checkpointer: this.memory });
    }



    async testpromptTemplate2() {
        console.log("\n\n IN the second test template ")

        // const config3 = { configurable: { thread_id: uuidv4() } };
        const input4 = {
            messages: [
                {
                    role: "user",
                    content: "Why does this matter to you?",
                },
            ],
            adjective: "crotchety",
        };
        const output5 = await this.app2.invoke(input4, this.config);
        console.log(output5.messages[output5.messages.length - 1]);
        this.testpromptTemplateOTHER();
    }



    async testpromptTemplateOTHER_checkold() {
        console.log("\n\n IN the different test template the second time")

        // const config3 = { configurable: { thread_id: uuidv4() } };
        const input4 = {
            messages: [
                {
                    role: "user",
                    content: "Okay can you tell me about the guy we were talking about in the beginning?",
                },
            ]
        };
        const output5 = await this.app3.invoke(input4, this.config);
        console.log(output5.messages[output5.messages.length - 1]);
        this.testMemory4();
    }

    async testMemory4() {


        console.log("\nn\nIn test memory final 4")
        const input = [
            {
                role: "user",
                content: "So what was the thing with the hat?",
            },
        ];

        const output = await this.app.invoke({ messages: input }, this.config);
        console.log(output.messages[output.messages.length - 1]);

    }

}

export function getLLMModel() {
    const model = new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
    });
    return model;
}

export async function askLLM(systemMessage: string, humanMessage: string) {

    const model = new ChatOpenAI({
        model: "gpt-4o-mini", configuration: {
            baseURL: process.env.OPENAI_BASE_URL,
            apiKey: process.env.OPENAI_API_KEY
        },
    });

    const promptTemplate = ChatPromptTemplate.fromMessages([
        ["system", systemMessage],
        ["human", humanMessage]
    ]);
    const chain = RunnableSequence.from([promptTemplate, model, new StringOutputParser()])

    const output = await chain.invoke({})
    return output;
}








