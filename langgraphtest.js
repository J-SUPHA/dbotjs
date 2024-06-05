import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import { END, MessageGraph } from "@langchain/langgraph";

const model = new ChatOpenAI({
  openAIApiKey: "sk-mx15Qk5ghd20jeHusl",
  maxTokens: 100,
  stop: ["assistant\n"],
  configuration: {
    baseURL: "http://47.189.140.220:5000/v1",
  },
});

const graph = new MessageGraph();

graph.addNode("oracle", async (state) => {
  return model.invoke(state);
});

graph.addEdge("oracle", END);

graph.setEntryPoint("oracle");

const runnable = graph.compile();

// For Message graph, input should always be a message or list of messages.
const res = await runnable.invoke(new HumanMessage("What is 1 + 1?"));

console.log(res);
