import OpenAI from "openai";
import dotenv from "dotenv";
import { Message, MessageCreateParams } from "openai/resources/beta/threads/messages/messages";
import { RequiredActionFunctionToolCall, Run } from "openai/resources/beta/threads/runs/runs";
import { Thread } from "openai/resources/beta/threads/threads";

dotenv.config();

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// this is a function with an argument
const specialGreet = async (name: string) => {
  return `Hello ${name}`;
};

const specialGreetFunctionDefinition = () => {
  return {
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
};

// this is a function without arguments
const currentWeather = () => {
  return "humidity 20, temperature 28, raining";
};

const nameFunctionDefinition = () => {
  return {
    name: "currentWeather",
    description: "This function returns the current weather'",
  };
};

const assistant = async () => {
  const assistant = await client.beta.assistants.create({
    name: "Core assistant",
    description:
      "you are a helpful assistant that helps user do things they want to do",
    tools: [
      { type: "function", function: nameFunctionDefinition() },
      { type: "function", function: specialGreetFunctionDefinition() },
    ],
    model: "gpt-4-1106-preview",
  });
  return assistant;
};

const getCoreAssistantId = () => {
  return "asst_zTRe5WTuBJHRRMkIiG4gvgiI";
};

const getThread = () => {
  return "thread_0wb4iwsEBGovrNGak5QXENzB";
};

const createNewMessage = async (message: string) => {
  const inputMessage: MessageCreateParams = {
    role: "user",
    content: message,
  };
  const messageResponse = await client.beta.threads.messages.create(
    getThread(),
    inputMessage
  );
  return messageResponse;
};

interface IFunctionArgument {
  name: string;
}

const retrieveMessagesInThread = async () => {
  const messages = await client.beta.threads.messages.list(getThread());
  console.log(messages);
  console.log(messages.data[0].content);
  return messages;
};

const delayedStatus = ["queued", "cancellling", "in_progress"];

// run the specific function and return the needed response
const runFunction = async (
  functionName: string,
  functionArgument: IFunctionArgument
) => {
  if (functionName == "specialGreet") {
    return await specialGreet(functionArgument.name);
  }
  return currentWeather();
};

const resopnsePoller = async (run: Run, thread: string): Promise<Message[]>=> {
  try {
    console.log("RESPONSE POLLER WAS CALLED")
    let messages: Message[] = []
    while (delayedStatus.includes(run.status)) {
      console.log("run status", run.status);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // wait for 1 second
      run = await client.beta.threads.runs.retrieve(thread, run.id);
      console.log("run status", run.status);
    }

    if (run.status == "requires_action") {
      console.log("run requires action");
      const toolCalls = run.required_action?.submit_tool_outputs.tool_calls
      if (toolCalls == undefined) {
        throw new Error("Tool calls not provided")
      }

      console.log("FOLLOWING TOOLS ARE NEEDED", toolCalls)
      const toolCall = run.required_action?.submit_tool_outputs.tool_calls[0];
      const functionName = toolCall?.function.name;
      const functionArguments = toolCall?.function.arguments;
      if (!functionName || !functionArguments) {
        throw new Error("Function name or arguments not provided");
      }
      console.log(
        "function name",
        functionName,
        "function arguments",
        functionArguments
      );
      const functionArgumentObject: IFunctionArgument =
        JSON.parse(functionArguments);
      const output = await runFunction(functionName, functionArgumentObject);
      console.log(
        "%c THIS IS THE OUTPUT",
        "background: #222; color: #bada55",
        output
      );

      console.log("This is the tool call Id", toolCall.id);
      run = await client.beta.threads.runs.submitToolOutputs(thread, run.id, {
        tool_outputs: [{ tool_call_id: toolCall.id, output: output }],
      });
      console.log("Tool call completed and response submitted");
      messages = await resopnsePoller(run, thread); // again wait for run to finish
    }

    if (run.status === "completed") {
      console.log("run completed", run.status);
      messages = (await client.beta.threads.messages.list(thread)).data
    }

    return messages
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createRun = async (message: string) => {
  try {
    // first insert the message into the thread
    const thread = getThread();
    await createNewMessage(message);
    const assistant = getCoreAssistantId();

    let run = await client.beta.threads.runs.create(thread, {
      assistant_id: assistant,
    }); // create run
    const messages = await resopnsePoller(run, thread); // wait for the run to finish

    return messages
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const addTool = async () => {
  const assistant = await client.beta.assistants.update(getCoreAssistantId(), {
    tools: [{ type: "function", function: specialGreetFunctionDefinition() }],
  });
  console.log("assistantId", assistant.id);
};

const assistantBackup = "assistantId asst_zTRe5WTuBJHRRMkIiG4gvgiI";

async function main (){
  const messages = await createRun(
    "I am a special person, greet me in a special way."
  );
  console.log("response", messages[0].content)
}

main()