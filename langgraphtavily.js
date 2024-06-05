import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const tools = [
  new TavilySearchResults({
    apiKey: "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",
    maxResults: 1,
  }),
];

import { ToolExecutor } from "@langchain/langgraph/prebuilt";

const toolExecutor = new ToolExecutor({
  tools,
});

import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  openAIApiKey: "sk-mx15Qk5ghd20jeHusl",
  maxTokens: 100,
  stop: ["assistant\n"],
  configuration: {
    baseURL: "http://47.189.140.220:5000/v1",
  },
});

import { convertToOpenAIFunction } from "@langchain/core/utils/function_calling";

const toolsAsOpenAIFunctions = tools.map((tool) =>
  convertToOpenAIFunction(tool)
);

const newModel = model.bind({
  functions: toolsAsOpenAIFunctions,
});

import { BaseMessage } from "@langchain/core/messages";

const agentState = {
  messages: {
    value: (x, y) => x.concat(y),
    default: () => [],
  },
};

import { FunctionMessage } from "@langchain/core/messages";
// import { AgentAction } from "@langchain/core/actions";
// import { RunnableConfig } from "@langchain/core/runnables";

// Define the function that determines whether to continue or not
const shouldContinue = (state) => {
  const { messages } = state;
  const lastMessage = messages[messages.length - 1];
  // If there is no function call, then we finish
  if (
    !("function_call" in lastMessage.additional_kwargs) ||
    !lastMessage.additional_kwargs.function_call
  ) {
    return "end";
  }
  // Otherwise if there is, we continue
  return "continue";
};

// Define the function to execute tools
const _getAction = (state) => {
  const { messages } = state;
  // Based on the continue condition
  // we know the last message involves a function call
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) {
    throw new Error("No messages found.");
  }
  if (!lastMessage.additional_kwargs.function_call) {
    throw new Error("No function call found in message.");
  }
  // We construct an AgentAction from the function_call
  return {
    tool: lastMessage.additional_kwargs.function_call.name,
    toolInput: JSON.stringify(
      lastMessage.additional_kwargs.function_call.arguments
    ),
    log: "",
  };
};

// Define the function that calls the model
const callModel = async (state) => {
  const { messages } = state;
  const response = await newModel.invoke(messages);
  // We return a list, because this will get added to the existing list
  return {
    messages: [response],
  };
};

const callTool = async (state) => {
  const action = _getAction(state);
  // We call the tool_executor and get back a response
  const response = await toolExecutor.invoke(action);
  // We use the response to create a FunctionMessage
  const functionMessage = new FunctionMessage({
    content: response,
    name: action.tool,
  });
  // We return a list, because this will get added to the existing list
  return { messages: [functionMessage] };
};

export { shouldContinue, _getAction, callModel, callTool };

import { END, StateGraph } from "@langchain/langgraph";

// Define a new graph
const workflow = new StateGraph({
  channels: agentState,
});

// Define the two nodes we will cycle between
workflow.addNode("agent", callModel);
workflow.addNode("action", callTool);

// Set the entrypoint as `agent`
// This means that this node is the first one called
workflow.setEntryPoint("agent");

// We now add a conditional edge
workflow.addConditionalEdges(
  // First, we define the start node. We use `agent`.
  // This means these are the edges taken after the `agent` node is called.
  "agent",
  // Next, we pass in the function that will determine which node is called next.
  shouldContinue,
  // Finally we pass in a mapping.
  // The keys are strings, and the values are other nodes.
  // END is a special node marking that the graph should finish.
  // What will happen is we will call `should_continue`, and then the output of that
  // will be matched against the keys in this mapping.
  // Based on which one it matches, that node will then be called.
  {
    // If `tools`, then we call the tool node.
    continue: "action",
    // Otherwise we finish.
    end: END,
  }
);

// We now add a normal edge from `tools` to `agent`.
// This means that after `tools` is called, `agent` node is called next.
workflow.addEdge("action", "agent");

// Finally, we compile it!
// This compiles it into a LangChain Runnable,
// meaning you can use it as you would any other runnable
const app = workflow.compile();

import { HumanMessage } from "@langchain/core/messages";

const inputs = {
  messages: [new HumanMessage("what is the weather in sf")],
};

const response = await app.invoke(inputs);
console.log(response);
