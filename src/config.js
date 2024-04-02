import dotenv from "dotenv";
dotenv.config();

// Centralized configuration object
const config = {
  botToken: process.env.BOT_TOKEN,
  channelIds: process.env.CHANNEL_IDS ? process.env.CHANNEL_IDS.split(",") : [],
  llmApiKey: process.env.OPENAI_API_KEY || "sk-blabhablahdosentmatter",
  llmBaseUrl: process.env.LLM_BASE_URL || "https://api.openai.com/v1", // Default to OpenAI if not specified
  temperature: process.env.TEMPERATURE || 1, // Default temperature value
  maxTokens: process.env.MAX_TOKENS || 200, // Default max tokens
  stop: process.env.STOP_WORDS || [], // Default stop words
  repetitionPenalty: process.env.REPETITION_PENALTY || 1.3, // Default repetition penalty
  topP: process.env.TOP_P || 0.9, // Default top p value
  minP: process.env.MIN_P || 0.06, // Default min p value
};

export default config;
