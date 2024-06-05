import { OpenAI } from "@langchain/openai";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import config from "./src/config.js";

const stopList = [...config.openAIConfig.stop, ...["assistant\n"]];
const openAIParams = {
  ...config.openAIConfig,
  openAIApiKey: config.llmApiKey,
  configuration: {
    baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
  },
  baseURL: config.llmBaseUrl,

  stop: stopList,
};

const llmCall = async (prompt, stopList) => {
  const response = await llm.invoke(prompt, stopList);
  return response;
};

const example = "When was langchain created?";

const searchQuery = `${config.specialTokens.system}Your job is to turn the question in to a one word search query.${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}
${example}${config.specialTokens.endOfTurn}
${config.specialTokens.botTurn}\n`;

const handleInteraction = async () => {
  const response = await llmCall(searchQuery, ["assistant\n"]);

  const wikiResults = await searchTool.invoke(response);

  const answerQuery = `${config.specialTokens.system}You are an AI assistant. Your job is to answer the user's question as best as you can using the search results.\n${wikiResults}${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}
  ${example}${config.specialTokens.endOfTurn}
  ${config.specialTokens.botTurn}\n`;

  const answer = await llmCall(answerQuery, ["assistant\n"]);

  console.log(answer);
};

handleInteraction();
