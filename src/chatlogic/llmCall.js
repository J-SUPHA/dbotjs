import config from "../config.js";
import { OpenAI, ChatOpenAI } from "@langchain/openai";
import { Ollama } from "@langchain/community/llms/ollama";

export async function llmCall(prompt, stopWords) {
  // console.log("Prompt:", prompt);
  const stopList = [...config.openAIConfig.stop, ...stopWords];
  const openAIParams = {
    ...config.openAIConfig,
    openAIApiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
    },
    // baseURL: config.llmBaseUrl,
    stop: stopList,
  };

  const llm = new OpenAI(openAIParams);

  try {
    const response = await llm.invoke(prompt);

    // console.log(response);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
}

export async function llmChatCall(promptTemplate, messageObjects, stopWords) {
  // console.log("Prompt:", prompt);
  const stopList = [...config.openAIConfig.stop, ...stopWords];
  const openAIParams = {
    ...config.openAIConfig,
    openAIApiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
    },
    // baseURL: config.llmBaseUrl,
    stop: stopList,
  };

  const llm = new ChatOpenAI(openAIParams);

  try {
    const chain = promptTemplate.pipe(llm);
    const response = await chain.invoke({
      messages: messageObjects,
    });

    // console.log(response);
    return response.content;
  } catch (error) {
    console.error("Request failed:", error);
  }
}

export async function llmChatCallOllama(
  promptTemplate,
  messageObjects,
  stopWords
) {
  const stopList = [...config.openAIConfig.stop, ...stopWords];

  const llm = new Ollama({
    baseUrl: "http://127.0.0.1:11434",
    model: "llama3",
  });

  try {
    const chain = promptTemplate.pipe(llm);
    const response = await chain.invoke({
      messages: messageObjects,
    });

    console.log(response);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
}
