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
import chalk from "chalk";

dotenv.config();

// create a new instance of the OpenAI client
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// sample function that greets the user in a special way. the implementation are, but not limited to, the following:
// 1. Greet the user in a specific language
// 2. Greet the user with a specific message
// 3. Greet the user with a specific tone
// etc.

interface IBasicInformation {
  age: number;
  weight: number;
  height: number;
  gender: string;
}

interface ILifeStyle {
  dailyRoutine: "sedenatry" | "light" | "moderate" | "heavy" | "very heavy";
  exerciseRoutine?: {
    exerciseType: "cardio" | "strength" | "flexibility" | "balance" | "none";
    frequency: "daily" | "weekly" | "monthly";
  };
}

interface IDietPreferences {
  preference:
    | "vegetarian"
    | "non-vegetarian"
    | "vegan"
    | "pescatarian"
    | "omnivore"
    | "ketogenic"
    | "paleo";
  allergies: string[];
  intolerances: string[];
  dislikedFood?: string[];
  favouriteFood?: string[];
}

interface IHealthGoals {
  weightGoal?: "gain" | "loss" | "maintain";
  specificNutritionGoal: string;
  medicalConditions: string[];
}

interface IEatingHabits {
  mealsPerDay: number;
  mealComplexity: "simple" | "moderate" | "complex";
  cookingTime:
    | "less than 30 minutes"
    | "30-60 minutes"
    | "more than 60 minutes";
}

interface IConstraints {
  financial: {
    budget: number;
    budgetType: "daily" | "weekly" | "monthly";
  };
  geographical: {
    location: string;
  };
}

// this interface will be used to model database collections.
interface IUserPreferences {
  type: "userPreferences";
  basicInformation: IBasicInformation;
  lifeStyle: ILifeStyle;
  dietPreferences: IDietPreferences;
  healthGoals: IHealthGoals;
  eatingHabits: IEatingHabits;
  constraints: IConstraints;
}

// create nutrition plan

// export const CreateNutritionPlan = async (
//   client: OpenAI,
//   userPreferences: string,
//   userGoal: string,
//   threadId: string
// ) => {
//   // pass
// };

// this function needs to generate an output.
export const createNutritionPlan = async (
  basicInformation: IBasicInformation,
  lifeStyle: ILifeStyle,
  dietPreferences: IDietPreferences,
  healthGoals: IHealthGoals,
  eatingHabits: IEatingHabits,
  constraints: IConstraints
) => {
  // call the nutrition assistant to create the workout plan
  console.log(chalk.bgGreen("THIS IS THE WOROUT PLAN"));
  console.log(chalk.red("This is the basic information", basicInformation));
  console.log(chalk.red("This is the life style", lifeStyle));
  console.log(chalk.red("This is the diet preferences", dietPreferences));
  console.log(chalk.red("This is the health goals", healthGoals));
  console.log(chalk.red("This is the eating habits", eatingHabits));
  console.log(chalk.red("This is the constraints", constraints));
  return "Testing nutrition plan generation";
};

export const createNutritionPlanSchema = () => {
  const createNutritionPlanSchema: FunctionDefinition = {
    name: "create_nutrition_plan",
    description:
      `Creates a nutrition plan for the user when core assistant has all the necessary information needed to create the diet plan.
      List of information:
      - basicInformation: The basic information of the user which includes age [required], weight[required], height [required], gender [required].
      - lifestyle: The lifestyle of the user which includes daily routine and exercise routine [required], daily routine [optional].
      - dietPreferences: The diet preferences of the user which includes preferences [required], allergies [required], intolerances, disliked food, favourite food.
      - healthGoals: The health goals of the user which includes weight goal [required], specific nutrition goal [required], medical conditions [required].
      - eatingHabits: The eating habits of the user which includes meals per day [required], meal complexity [optional], cooking time [optional].
      - constraints: The constraints of the user which includes financial [required], geographical [optional].

      The diet plan is created based on the information provided by the user.
      `,
    parameters: {
      type: "object",
      properties: {
        basicInformation: {
          type: "object",
          peroperteis: {
            age: { type: "number", description: "age of the user" },
            weight: { type: "number", description: "weight of the user" },
            height: { type: "number", description: "height of the user" },
            gender: { type: "string", description: "gender of the user" },
          },
          lifeStyle: {
            type: "object",
            dailyRoutine: {
              type: "string",
              description: `
                        The daily routine of the user which includes:
                        - sedentary
                        - light
                        - moderate
                        - heavy
                        - very heavy
                        `,
            },
            exerciseRoutine: {
              type: "object",
              properties: {
                exerciseType: {
                  type: "string",
                  description:
                    "The type of exercise that the user does, which can be of type 'cardio', 'strength', 'flexibility', 'balance', 'none'",
                },
                frequency: {
                  type: "string",
                  description:
                    "The frequency of the exercise that the user does, which can be of type 'daily', 'weekly', 'monthly'",
                },
              },
            },
          },
          dietPreferences: {
            type: "object",
            properties: {
              preference: {
                type: "string",
                description:
                  "The user's diet preference, which can be of type 'vegetarian', 'non-vegetarian', 'vegan', 'pescatarian', 'omnivore', 'ketogenic', 'paleo' ",
              },
              allergies: {
                type: "array",
                items: { type: "string" },
                description: "an array of all the allergies that the user has",
              },
              intolerances: {
                type: "array",
                items: { type: "string" },
                description:
                  "an array of all the intolerances that the user has",
              },
              dislikedFood: {
                type: "array",
                items: { type: "string" },
                description: "an arryay of all the food that the user dislikes",
              },
              favouriteFood: {
                type: "array",
                items: { type: "string" },
                description: "an array of all the food that the user likes",
              },
            },
          },
          healthGoals: {
            type: "object",
            properties: {
              weightGoal: {
                type: "string",
                description:
                  "The user's weight goal, which can be of type 'gain', 'loss', 'maintain' ",
              },
              specificNutritionGoal: {
                type: "string",
                description: "The user's specific nutrition goal",
              },
              medicalConditions: {
                type: "array",
                items: { type: "string" },
                description:
                  "an array of all the medical conditions that the user has",
              },
            },
          },
          eatingHabits: {
            type: "object",
            properties: {
              mealsPerDay: {
                type: "number",
                description: "The number of meals that the user has per day",
              },
              mealComplexity: {
                type: "string",
                description:
                  "The complexity of the meals that the user has, which can be of type 'simple', 'moderate', 'complex' ",
              },
              cookingTime: {
                type: "string",
                description:
                  "The cooking time of the user, which can be of type 'less than 30 minutes', '30-60 minutes', 'more than 60 minutes' ",
              },
            },
          },
          constraints: {
            type: "object",
            properties: {
              financial: {
                type: "object",
                properties: {
                  budget: { type: "number", description: "The user's budget" },
                  budgetType: {
                    type: "string",
                    description:
                      "The type of the user's budget, which can be of type 'daily', 'weekly', 'monthly' ",
                  },
                },
              },
              geographical: {
                type: "object",
                properties: {
                  location: {
                    type: "string",
                    description:
                      "The user's location so that food specific to that location can be added in the plan",
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return createNutritionPlanSchema;
};

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

// creates a new empty thread and returns it's id
const createNewThread = async () => {
  const thread = await client.beta.threads.create();
  return thread.id;
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
const getCoreAssistantId = (): string => {
  const coreAssistantId = process.env.ASSISTANT_ID;
  if (coreAssistantId == undefined) {
    throw new Error("Thread id not provided");
  }
  return coreAssistantId;
};

// returns a hard coded id of the thread
const getThreadId = (): string => {
  const threadId = process.env.THREAD_ID;
  if (threadId == undefined) {
    throw new Error("Thread id not provided");
  }
  return threadId;
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
  if (functionArgument.type === "userPreferences") {
    console.log("Function type is user preferences");
    const basicInformation = functionArgument.basicInformation;
    const lifeStyle = functionArgument.lifeStyle;
    const dietPreferences = functionArgument.dietPreferences;
    const healthGoals = functionArgument.healthGoals;
    const eatingHabits = functionArgument.eatingHabits;
    const constraints = functionArgument.constraints;
    return createNutritionPlan(
      basicInformation,
      lifeStyle,
      dietPreferences,
      healthGoals,
      eatingHabits,
      constraints
    );
  }
  throw new Error(
    "Function argment type not matching with available functions"
  );
};

type IFunctionArgument =
  | IWeatherFunctionArguments
  | ISpecialGreetFunctionArguments
  | IUserPreferences;

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
    return functionArguments;
  }
  if (tool.function.name == "create_nutrition_plan") {
    const parsedData = JSON.parse(tool.function.arguments);
    console.log(chalk.bgRed("This is parsed data"), parsedData);
    const functionArguments: IUserPreferences = {
      type: "userPreferences",
      basicInformation: parsedData.basicInformation,
      lifeStyle: parsedData.lifeStyle,
      dietPreferences: parsedData.dietPreferences,
      healthGoals: parsedData.healthGoals,
      eatingHabits: parsedData.eatingHabits,
      constraints: parsedData.constraints,
    };
    console.log(chalk.bgGray("This is function arguments"), functionArguments);
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
      console.log(
        chalk.green("tools parameters", toolCalls[0].function.arguments)
      );
      console.log(chalk.cyan("tools name", toolCalls[0].function.name));
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
  const assistant = await client.beta.assistants.retrieve(getCoreAssistantId());
  return assistant;
};

async function main() {
  const messages = await createRun(
    "create a nutrition plan for me I am a 25 year old male, vegetarian, no allergies. I want to loose weight. I have a sedentary lifestyle. I eat 3 meals a day. I have a budget of 1000 dollars per month. I live in New York."
  );
  console.log("response", messages[0].content);
  // console.log("Adding the plan generation tool to assistant")
  // const createNutritionPlan = createNutritionPlanSchema()
  // await addToolToAssistant(createNutritionPlan)
}

main();
