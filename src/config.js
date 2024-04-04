import dotenv from "dotenv";
import fs from "fs";
import { fileURLToPath } from "url";
import path from "path";

// Load environment variables
dotenv.config();

// Derive the directory name in ES module scope
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the path to your config.json file
const configPath = path.resolve(__dirname, "..", "config.json");
// Read and parse the config.json file
let configJson = {};
try {
  const configFile = fs.readFileSync(configPath, "utf8");
  configJson = JSON.parse(configFile);
} catch (error) {
  console.error("Failed to read or parse config.json:", error);
}
// Centralized configuration object
const config = {
  botToken: process.env.BOT_TOKEN,
  ignorePatterns: configJson.ignorePatterns || [],
  k: configJson.K || 15,
  llmApiKey: process.env.OPENAI_API_KEY || "sk-blabhablahdosentmatter",
  ...configJson,
  channelIds: configJson.channelIds
    ? configJson.channelIds.map((id) => String(id))
    : [],
};
export default config;
