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
import { AIMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ExplorationPromptFormat, ExplorationPromptFormatter, RequiresTopicBackgroundFormatter, StructuredOutputGraphAnnotation, StructureType, TopicBackgroundFormat, } from "./langchain_formatters.js";

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { CustomError, ErrorCategory, ErrorType } from "../utils/result_handling.js";
import { Goals } from "../utils/global_enums.js";
import { EventInputs } from "../models/input_models.js";

export class LangChainLLMService {
    llm: ChatOpenAI;
    threadID: string;
    memory: MemorySaver;
    eventInput: EventInputs;

    app;
    config: object;
    app2;
    app3;
    structuredOutputResp;

    // json data for LLM prompts
    dialogueData;
    explorationData;
    deliberationData;

    genericPromptData;

    constructor(eventInput: EventInputs) {
        this.eventInput = eventInput;
        this.llm = this._getLLMModel();
        this.threadID = uuidv4();
        this._setUpService();
    }

    _importJsonData() {
        // bring in JSON agenda items
        const __dirname = dirname(fileURLToPath(import.meta.url));
        try {
            this.dialogueData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/dialogue.json'), 'utf-8'));
            this.explorationData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/exploration.json'), 'utf-8'));
            this.deliberationData = JSON.parse(readFileSync(join(__dirname, '../section_data/initial_event/deliberation.json'), 'utf-8'));
            this.genericPromptData = JSON.parse(readFileSync(join(__dirname, '../section_data/generic_llm_prompts.json'), 'utf-8'));
        } catch (e) {
            throw new CustomError(ErrorCategory.ParsingError, "Unable to parse exploration section data.", ErrorType.error, e);
        }
    }

    _getLLMModel() {
        return new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0,
        });
    }

    _setUpService() {
        // import data for prompts 
        this._importJsonData();
        // create memory
        this.memory = new MemorySaver();
        // set up config
        this.config = { configurable: { thread_id: this.threadID } };
    }


    async initialContextPrompt() {
        const guidance: string = this._getInitialModelGuidence();

        const prompt = ChatPromptTemplate.fromMessages([
            ["system", guidance],
            new MessagesPlaceholder("messages"),
        ]);

        // the State
        const GraphAnnotation = Annotation.Root({
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

        const intitialContextApp = workflow2.compile({ checkpointer: this.memory });

        const input4 = {
            messages: [
                {
                    role: "user",
                    content: "Describe some examples of what you understand and what you will give.",
                },
            ]
        };
        const output4 = await intitialContextApp.invoke(input4, this.config);
        console.log(output4.messages[output4.messages.length - 1]);
    }

    _getInitialModelGuidence(): string {

        let llmContextGuidance: string[] = [];

        llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Initial Guidance").content.replaceAll("this_topic_replace", this.eventInput.topic));

        const finalGoal: string = this.eventInput.goals[this.eventInput.goals.length - 1];

        if (finalGoal == Goals.dialogue) {
            llmContextGuidance.push(this.dialogueData.llm_prompts.find(item => item.title == "Event Goal").content.replaceAll("this_topic_replace", this.eventInput.topic));
        } else if (finalGoal == Goals.exploration) {
            llmContextGuidance.push(this.explorationData.llm_prompts.find(item => item.title == "Event Goal").content.replaceAll("this_topic_replace", this.eventInput.topic));
        } else if (finalGoal == Goals.deliberation) {
            llmContextGuidance.push(this.deliberationData.llm_prompts.find(item => item.title == "Event Goal").content.replaceAll("this_topic_replace", this.eventInput.topic));
        }
        if (this.eventInput.topicDescription != null) {
            llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Topic Description").content + this.eventInput.topicDescription);
        }
        llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Audience Description").content + this.eventInput.audienceDescription);

        if (this.eventInput.isFacilitated == true) {
            llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Facilitated Description").content + this.eventInput.audienceDescription);
        } else {
            llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Non-Facilitated Description").content + this.eventInput.audienceDescription);
        }

        let llmBackgroundInstruction: string = "";

        for (let i = 0; i < llmContextGuidance.length; i++) {
            llmBackgroundInstruction = llmBackgroundInstruction + "\n" + llmContextGuidance[i];
        }
        console.log("background instruction: " + llmBackgroundInstruction);

        return llmBackgroundInstruction;
    }


    async determineBackgroundInfoFromLLM(isInitialQuery: boolean, humanQuery: string): Promise<TopicBackgroundFormat> {
        const message = await this._getStructuredLLMResponses(isInitialQuery, humanQuery, StructureType.explorationTopicBackground);
        const validatedMessage = RequiresTopicBackgroundFormatter.parse(message);
        return new TopicBackgroundFormat(validatedMessage);
    }

    async getExplorationPromptFromLLM(isInitialQuery: boolean, humanQuery: string): Promise<ExplorationPromptFormat> {
        const message = await this._getStructuredLLMResponses(isInitialQuery, humanQuery, StructureType.explorationPrompt);
        const validatedMessage = ExplorationPromptFormatter.parse(message);
        return new ExplorationPromptFormat(validatedMessage);
    }

    async _getStructuredLLMResponses(isInitialQuery: boolean, humanQuery: string, structureType: StructureType) {
        // bind schema to the model
        let modelWithStructure;

        structureType == StructureType.explorationTopicBackground ? modelWithStructure = this.llm.withStructuredOutput(RequiresTopicBackgroundFormatter) : modelWithStructure = this.llm.withStructuredOutput(ExplorationPromptFormatter);

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

        let messageArray = [new HumanMessage(humanQuery)];
        if (isInitialQuery) {
            const guidance: string = this._getInitialModelGuidence();
            messageArray = [
                new SystemMessage(guidance),
                new HumanMessage(humanQuery)
            ]
        }
        this.structuredOutputResp = await structuredOutputApp.invoke({
            messages: messageArray
        }, this.config);

        return JSON.parse(this.structuredOutputResp["messages"][this.structuredOutputResp["messages"].length - 1]["content"]);
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


}








