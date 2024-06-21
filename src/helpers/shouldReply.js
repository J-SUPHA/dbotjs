import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { getLastXMessages } from "../memory/chatlogFunctions.js";
import getMessageType from "../helpers/message-type.js";

async function getLastThreeMessages(id, k, channelType) {
  const messages = await getLastXMessages(id, k, channelType);

  const formattedMessages = messages
    .map((msg) => `${msg.name}: ${msg.clean_content}`)
    .join("\n");

  return formattedMessages;
}

async function createChain(client) {
  const botName = client.user.username;
  // Define the analysis template
  const ANALYSIS_TEMPLATE = `Analyze the following passage and determine if ${botName} should reply next. Use the following criteria to make the decision:

Criteria when to reply, if any of the following conditions are met
1. If ${botName} was asked a question or told to do something.
2. If the conversation seems to be directed towards ${botName}.
3. If '${botName}' or '${botName.toLowerCase()}' was directly mentioned. 

Example criteria when not to reply,
1. If the last message was sent by ${botName}.
2. If another person was asked a question or the message was @-mentioned to another person.

The response should be a JSON object with the key "shouldreply" and the value should be either true or false.

Passage:
{input}
`;

  const prompt = PromptTemplate.fromTemplate(ANALYSIS_TEMPLATE);

  // Define the simplified schema using Zod
  const schema = z.object({
    shouldreply: z.boolean().describe("Whether the person should reply next"),
  });

  // Initialize and bind the model
  const model = new OllamaFunctions({
    temperature: 0.1,
    model: "llama3",
  }).bind({
    functions: [
      {
        name: "should_reply",
        description: "Determines if the person should reply next.",
        parameters: {
          type: "object",
          properties: zodToJsonSchema(schema).properties,
        },
      },
    ],
    function_call: {
      name: "should_reply",
    },
  });

  // Use a JsonOutputFunctionsParser to get the parsed JSON response directly
  const chain = await prompt
    .pipe(model)
    .pipe(new JsonOutputFunctionsParser(schema));

  return chain;
}

// an async function that will take the client, a channel id, and return a boolean if the bot should reply
export async function shouldReply(client, message) {
  const messageType = getMessageType(message);
  const messages = await getLastThreeMessages(
    message.channelId,
    5,
    messageType
  );
  console.log(messages);

  const chain = await createChain(client);

  const response = await chain.invoke({
    input: messages,
  });

  return response.shouldreply;
}
