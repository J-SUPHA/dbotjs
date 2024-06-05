import { ChatOpenAI } from "@langchain/openai";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { initializeAgentExecutor, ZeroShotAgent } from "@langchain/agents";
import config from "./src/config.js";

async function main() {
  try {
    // Setup ChatOpenAI LLM
    const llm = new ChatOpenAI({
      openAIApiKey: config.llmApiKey,
      baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
    });

    // Setup Wikipedia tool
    const wikipediaTool = new WikipediaQueryRun({
      topKResults: 3,
      maxDocContentLength: 4000,
    });

    // Define tools
    const tools = [wikipediaTool];

    // Define the agent
    const agent = new ZeroShotAgent({
      llm,
      tools,
      prompt: `
      You are an agent that can answer questions by searching Wikipedia.
      You have access to the following tool:
      - wikipedia: use this tool to search for information on Wikipedia
      
      Use the following format:
      Question: the input question you need to answer
      Thought: you should always think about what to do
      Action: the action you want to take (wikipedia)
      Action Input: the input to the action
      Observation: the result of the action
      Thought: you should always think about what to do next
      Answer: the final answer to the original question
      
      Begin!
      Question: {input}
      Thought:
      `,
    });

    // Initialize agent executor
    const agentExecutor = await initializeAgentExecutor({
      agent,
      tools,
      llm,
    });

    // Define a function to handle user queries
    async function handleQuery(query) {
      try {
        const result = await agentExecutor.execute({ input: query });
        console.log("Final Answer:", result.output);
      } catch (error) {
        console.error("Error occurred:", error);
      }
    }

    // Example usage
    await handleQuery("When was LangChain created?");
  } catch (error) {
    console.error("Initialization Error:", error);
  }
}

main();
