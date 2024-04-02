import config from "../config.js";
import { OpenAI } from "@langchain/openai";

export default async function llmCall(prompt, stopWords) {
  const url = "http://api.ausboss.io/v1";

  const llm = new OpenAI({
    openAIApiKey: config.llmApiKey,
    configuration: {
      baseURL: config.llmBaseUrl,
    },
    maxTokens: config.maxTokens,
    temperature: config.temperature,
    top_p: config.topP,
    min_p: config.minP,
    repetition_penalty: config.repetitionPenalty,
    stop: [...config.stop, ...stopWords],
  });

  try {
    const response = await llm.invoke(prompt);
    console.log(response);
    return response;
  } catch (error) {
    console.error("Request failed:", error);
  }
}
