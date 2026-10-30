import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { v4 as uuidv4 } from "uuid";
import {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
    Annotation,
} from "@langchain/langgraph"
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
    queryCount: number;

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
        this.queryCount = 0;
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

    async getDialogueItem(formatString: string|null=null): Promise<string> {
        let systemMessage: string;
        if (this.queryCount < 1) {
            systemMessage = this._getInitialModelGuidenceString();
        } else {
            systemMessage = "Fulfill the following prompt in the context of your previous guidance."
        }
        const prompt = ChatPromptTemplate.fromMessages([
            ["system", systemMessage],
            new MessagesPlaceholder("messages"),
        ]);

        // the State
        const GraphAnnotation = Annotation.Root({
            // Spread `MessagesAnnotation` into the state to add the `messages` field.
            ...MessagesAnnotation.spec,
        });
        const runnable = prompt.pipe(this.llm);
        // the function that calls the model
        const callDialogueModel = async (state: typeof GraphAnnotation.State) => {
            const response = await runnable.invoke(state);
            // Update message history with response:
            return { messages: [response] };
        };

        const dialogueWorkflow = new StateGraph(GraphAnnotation)
            .addNode("model", callDialogueModel)
            .addEdge(START, "model")
            .addEdge("model", END);

        const intitialContextApp = dialogueWorkflow.compile({ checkpointer: this.memory });

        let humanQuery: string;
        if (formatString != null) {
            humanQuery = `Take the following string and reformat it to make sense in the context of the topic. For example, if the topic name should not be capitalized, don't capitalize it. Just make it sound normal and make sense and not be awkward. String: ${formatString}`;
        } else {
            humanQuery = this.dialogueData.llm_prompts.find((item: { title: string; }) => item.title == "Main Query").content.replaceAll("this_topic_replace", this.eventInput.topic)
        }

        const dialogueInput = {
            messages: [
                {
                    role: "user",
                    content: humanQuery,
                },
            ]
        };
        const dialogueOutput = await intitialContextApp.invoke(dialogueInput, this.config);
        console.log(dialogueOutput.messages[dialogueOutput.messages.length - 1].content);
        this.queryCount = this.queryCount + 1;
        return dialogueOutput.messages[dialogueOutput.messages.length - 1].content.toString();
    }


    async determineBackgroundInfoFromLLM(humanQuery: string): Promise<TopicBackgroundFormat> {
        const message = await this._getStructuredLLMResponses(humanQuery, StructureType.explorationTopicBackground);
        const validatedMessage = RequiresTopicBackgroundFormatter.parse(message);
        return new TopicBackgroundFormat(validatedMessage);
    }

    async getExplorationPromptFromLLM(humanQuery: string): Promise<ExplorationPromptFormat> {
        const message = await this._getStructuredLLMResponses(humanQuery, StructureType.explorationPrompt);
        const validatedMessage = ExplorationPromptFormatter.parse(message);
        return new ExplorationPromptFormat(validatedMessage);
    }

    async _getStructuredLLMResponses(humanQuery: string, structureType: StructureType) {
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
        if (this.queryCount < 1) {
            const guidance: string = this._getInitialModelGuidenceString();
            messageArray = [
                new SystemMessage(guidance),
                new HumanMessage(humanQuery)
            ]
        }
        this.structuredOutputResp = await structuredOutputApp.invoke({
            messages: messageArray
        }, this.config);

        this.queryCount = this.queryCount + 1;
        return JSON.parse(this.structuredOutputResp["messages"][this.structuredOutputResp["messages"].length - 1]["content"]);
    }

    _getInitialModelGuidenceString(): string {

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
            llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Facilitated Description").content);
        } else {
            llmContextGuidance.push(this.genericPromptData.find(item => item.title == "Non-Facilitated Description").content);
        }

        let llmBackgroundInstruction: string = "";

        for (let i = 0; i < llmContextGuidance.length; i++) {
            llmBackgroundInstruction = llmBackgroundInstruction + "\n" + llmContextGuidance[i];
        }
        console.log("background instruction: " + llmBackgroundInstruction);

        return llmBackgroundInstruction;
    }
}








