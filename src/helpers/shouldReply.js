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

// Define the analysis template
const ANALYSIS_TEMPLATE = `Analyze the following passage and determine if "Tensor" should reply next. Use the following criteria to make the decision:

Criteria:
1. If Tensor was asked a question.
2. If the conversation is between two people and its Tensor's turn to talk.
3. If Tensor was directly mentioned.

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

// // get the last 3 messages from a channel
// const messages = await getLastThreeMessages(
//   "1148253350404575352",
//   3,
//   "channel"
// );

// // Invoke the model with an input passage
// const response = await chain.invoke({
//   input: messages,
// });
// console.log(messages);
// console.log("\nShould Tensor reply next?");
// if (response.shouldreply) {
//   console.log("Yes, Tensor should reply next.");
// } else {
//   console.log("No, Tensor should not reply next.");
// }

// an async function that will take the client, a channel id, and return a boolean if the bot should reply
export async function shouldReply(client, message) {
  const messageType = getMessageType(message);
  const messages = await getLastThreeMessages(
    message.channelId,
    5,
    messageType
  );
  console.log(messages);

  const response = await chain.invoke({
    input: messages,
  });

  return response.shouldreply;
}
