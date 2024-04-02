import config from "../config.js";
import { OpenAI } from "@langchain/openai";

export default async function llmCall(prompt, stopWords) {
  const openAIParams = {
    ...config.openAIConfig,
    openAIApiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl,
    },
    stop: [...config.openAIConfig.stop, ...stopWords],
  };

  const llm = new OpenAI(openAIParams);

  try {
    const response = await llm.invoke(prompt);
    console.log(response);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
}
