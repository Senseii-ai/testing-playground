import OpenAI from "openai";
import dotenv from "dotenv";
import {
  Message,
  MessageCreateParams,
} from "openai/resources/beta/threads/messages/messages";
import {
  RequiredActionFunctionToolCall,
  Run,
} from "openai/resources/beta/threads/runs/runs";
import { Thread } from "openai/resources/beta/threads/threads";
import { FunctionDefinition } from "openai/resources";
import { AssistantTool } from "openai/resources/beta/assistants/assistants";

dotenv.config();

// create a new instance of the OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// sample function that greets the user in a special way. the implementation are, but not limited to, the following:
// 1. Greet the user in a specific language
// 2. Greet the user with a specific message
// 3. Greet the user with a specific tone
// etc.

interface ISpecialGreetFunctionArguments {
  type: "specialGreet";
  name: string;
}

const specialGreet = async (name: string) => {
  return `Hello ${name}`;
};

// return special greet function definition
const specialGreetFunctionDefinition = (): FunctionDefinition => {
  const specialGreetFunctionSchema: FunctionDefinition = {
    name: "specialGreet",
    description: "This function greets a user in a special way",
    parameters: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the person to greet",
        },
      },
    },
  };
  return specialGreetFunctionSchema;
};

// interface definition for the argument accespted by the currentWeather function
interface IWeatherFunctionArguments {
  type: "currentWeather";
  location: string;
}

// mock function for getting the current weather conditions.
const currentWeather = (location: string): string => {
  return "humidity 20, temperature 28, raining";
};

// return curretWeather function definition
const currentWeatherFunctionDefinition = (): FunctionDefinition => {
  const currentWeatherFunctionSchema: FunctionDefinition = {
    name: "currentWeather",
    description: "This function returns the current weather",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The location to get the current weather",
        },
      },
    },
  };
  return currentWeatherFunctionSchema;
};

// creates a new assistant (this is just a sample), I used this function to create the core assistant, then hard coded the assistant id.
const createNewAssistant = async () => {
  const assistant = await client.beta.assistants.create({
    name: "Core assistant",
    description:
      "you are a helpful assistant that helps user do things they want to do",
    tools: [
      { type: "function", function: currentWeatherFunctionDefinition() },
      { type: "function", function: specialGreetFunctionDefinition() },
    ],
    model: "gpt-4-1106-preview",
  });
  return assistant;
};

// returns a hard coded id of core assistant
const getCoreAssistantId = () => {
  return "asst_zTRe5WTuBJHRRMkIiG4gvgiI";
};

// returns a hard coded id of the thread
const getThreadId = (): string => {
  return "thread_0wb4iwsEBGovrNGak5QXENzB";
};

// create a new message in the thread
const createNewMessage = async (message: string) => {
  const inputMessage: MessageCreateParams = {
    role: "user",
    content: message,
  };
  const messageResponse = await client.beta.threads.messages.create(
    getThreadId(),
    inputMessage
  );
  return messageResponse;
};

// retrieve messages in the thread
const retrieveMessagesInThread = async () => {
  const messages = await client.beta.threads.messages.list(getThreadId());
  console.log(messages);
  console.log(messages.data[0].content);
  return messages;
};

// run the specific function and return the generated response, this example only has two functions, but you can add more functions and their definitions.
const runFunction = async (functionArgument: IFunctionArgument) => {
  if (functionArgument.type === "specialGreet") {
    console.log("Funciton type is special greet");
    return await specialGreet(functionArgument.name);
  }

  if (functionArgument.type === "currentWeather") {
    console.log("Funciton type is current weather");
    return currentWeather(functionArgument.location);
  }
  throw new Error(
    "Function argment type not matching with available functions"
  );
};

type IFunctionArgument =
  | IWeatherFunctionArguments
  | ISpecialGreetFunctionArguments;

// this function parses the function arguments from the tool call
const parseFunctionArguments = (
  tool: RequiredActionFunctionToolCall
): IFunctionArgument => {
  if (tool.function.name == "currentWeather") {
    const parsedData = JSON.parse(tool.function.arguments);
    const functionArguments: IWeatherFunctionArguments = {
      type: "currentWeather",
      location: parsedData.location,
    };
    return functionArguments;
  }
  if (tool.function.name == "specialGreet") {
    const parsedData = JSON.parse(tool.function.arguments);
    const functionArguments: ISpecialGreetFunctionArguments = {
      type: "specialGreet",
      name: parsedData.name,
    };
    console.log("check", functionArguments.type);
    return functionArguments;
  }
  throw new Error("Error parsing function arguments");
};

interface IToolOutput {
  tool_call_id: string;
  output: string;
}

// runTools runs the tools and returns the output
const runTools = async (
  tools: RequiredActionFunctionToolCall[]
): Promise<IToolOutput[]> => {
  let toolOutput = [];
  for (const tool of tools) {
    // convert the json string generated by the model, into a json object.
    const functionArguments = parseFunctionArguments(tool);
    const output = await runFunction(functionArguments);
    toolOutput.push({ tool_call_id: tool.id, output: output });
  }
  return toolOutput;
};

// models need time to generate response, this poller function waits for it to completely generate the output.
// TODO: add streaming output to the response poller
const resopnsePoller = async (run: Run, thread: string): Promise<Message[]> => {
  try {
    const delayedStatus = ["queued", "cancellling", "in_progress"];
    let messages: Message[] = [];
    // check if the run is complete or not.
    while (delayedStatus.includes(run.status)) {
      console.log("run status", run.status);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second
      run = await client.beta.threads.runs.retrieve(thread, run.id);
    }

    // if the run requires action, then run the tools
    if (run.status == "requires_action") {
      console.log("run requires action");
      const toolCalls = run.required_action?.submit_tool_outputs.tool_calls;
      if (toolCalls == undefined) {
        throw new Error("Tool calls not provided");
      }
      console.log("following tools are needed", toolCalls);
      // run the tools and generate aggregated outputs.
      const toolOutput = await runTools(toolCalls);
      console.log("Aggregated Output", toolOutput);
      // submit the output to the model
      run = await client.beta.threads.runs.submitToolOutputs(thread, run.id, {
        tool_outputs: toolOutput,
      });
      console.log("Tool call completed and response submitted");
      // wait for the response to be generated after tools output is submitted.
      messages = await resopnsePoller(run, thread); // again wait for run to finish
    }

    // if the run is completed, then get the messages
    if (run.status === "completed") {
      console.log("run completed", run.status);
      messages = (await client.beta.threads.messages.list(thread)).data;
    }

    return messages;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createRun = async (message: string) => {
  try {
    // first insert the message into the thread
    const thread = getThreadId();
    await createNewMessage(message);
    const assistant = getCoreAssistantId();

    // create run
    let run = await client.beta.threads.runs.create(thread, {
      assistant_id: assistant,
    });
    const messages = await resopnsePoller(run, thread); // wait for the run to finish

    return messages;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

// addToolToAssistant adds a tool to the assistant with the given function definition.
const addToolToAssistant = async (tool: FunctionDefinition) => {
  const assistant = await getAssistant();
  const tools = assistant.tools;
  // there can only be 128 tools per assistant
  if (tools.length == 128) {
    throw new Error("Maximum number of tools reached");
  }

  // check if tool already exists
  const isFound = tools.find(
    (t: AssistantTool) => t.type == "function" && t.function.name == tool.name
  );

  if (isFound) {
    throw new Error("Tool already exists");
  }

  tools.push({ type: "function", function: tool });
  const updatedAssistant = await client.beta.assistants.update(
    getCoreAssistantId(),
    { tools: tools }
  );
  console.log("assistant", updatedAssistant);
};

// getAssistant retrieves the assistant with the given id
const getAssistant = async () => {
  // const assistantBackup = "assistantId asst_zTRe5WTuBJHRRMkIiG4gvgiI";
  const assistant = await client.beta.assistants.retrieve(getCoreAssistantId());
  return assistant;
};

async function main() {
  const messages = await createRun(
    "I am a special person, greet me in a special way.and what is the weather in india"
  );
  console.log("response", messages[0].content);
}

main();
