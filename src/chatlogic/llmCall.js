import config from "../config.js";
import { OpenAI } from "@langchain/openai";

export default async function llmCall(prompt, stopWords) {
  const stopList = [...config.openAIConfig.stop, ...stopWords];
  console.log(stopList);
  const openAIParams = {
    ...config.openAIConfig,
    openAIApiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
    },
    baseURL: config.llmBaseUrl,
    stop: stopList,
  };

  const llm = new OpenAI(openAIParams);
  console.log(llm);
  // console.log(openAIParams);

  try {
    const response = await llm.invoke(prompt);

    console.log(response);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
}
