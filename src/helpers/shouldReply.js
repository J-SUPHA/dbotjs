import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OllamaFunctions } from "langchain/experimental/chat_models/ollama_functions";
import { JsonOutputFunctionsParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { getLastXMessages } from "../memory/chatlogFunctions.js";
import getMessageType from "./messageType.js";

async function getLastMessages(id, k, channelType) {
  const messages = await getLastXMessages(id, k, channelType);
  return messages.map((msg) => `${msg.name}: ${msg.clean_content}`).join("\n");
}

async function createPromptTemplate(botName, templateString) {
  return PromptTemplate.fromTemplate(
    templateString
      .replace(/{botName}/g, botName)
      .replace(/{botNameLower}/g, botName.toLowerCase())
  );
}

function createSchema(schemaDefinition) {
  return z.object(schemaDefinition);
}

async function createChain(
  client,
  promptTemplate,
  schema,
  modelName = "llama3"
) {
  const model = new OllamaFunctions({
    temperature: 0.2,
    model: modelName,
  }).bind({
    functions: [
      {
        name: "analysis_function",
        description: "Analyzes the input based on the given criteria.",
        parameters: {
          type: "object",
          properties: zodToJsonSchema(schema).properties,
        },
      },
    ],
    function_call: {
      name: "analysis_function",
    },
  });

  return promptTemplate.pipe(model).pipe(new JsonOutputFunctionsParser(schema));
}

export async function analyzeMessages(
  client,
  message,
  templateString,
  schemaDefinition,
  modelName = "llama3"
) {
  const botName = client.user.username;
  const messageType = getMessageType(message);
  const messages = await getLastMessages(message.channelId, 5, messageType);

  const promptTemplate = await createPromptTemplate(botName, templateString);
  const schema = createSchema(schemaDefinition);
  const chain = await createChain(client, promptTemplate, schema, modelName);

  const response = await chain.invoke({
    input: messages,
  });

  return response;
}

// Example usage for shouldReply
const SHOULD_REPLY_TEMPLATE = `
Analyze the following messages and use them as context to determine if {botName} should reply next. Use the following criteria to make the decision:

Criteria when to reply, if any of the following conditions are met:
1. If {botName} was asked a question, told to do something, greeted or mentioned in a way that warrants a response.
2. If the conversation seems to be directed towards {botName}.
3. If '{botName}' or '{botNameLower}' was directly mentioned.

Example criteria when not to reply:
1. If the last message was sent by {botName}.
2. If another person was asked a question or the message was @-mentioned to another person.

The response should be a JSON object with the key "shouldreply" and the value should be either true or false.

Messages: {input}
`;

const SHOULD_REPLY_SCHEMA = {
  shouldreply: z.boolean().describe("Whether the person should reply next"),
};

export async function shouldReply(client, message) {
  const results = [];

  for (let i = 0; i < 3; i++) {
    const result = await analyzeMessages(
      client,
      message,
      SHOULD_REPLY_TEMPLATE,
      SHOULD_REPLY_SCHEMA
    );
    console.log("shouldReply result:", result);
    results.push(result.shouldreply);
  }
  console.log("shouldReply results:", results);

  const trueCount = results.filter(Boolean).length;
  const falseCount = results.length - trueCount;
  console.log("trueCount:", trueCount);
  console.log("falseCount:", falseCount);
  console.log("The result is:", trueCount > falseCount);
  return trueCount > falseCount;
}
