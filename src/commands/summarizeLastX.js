import { getLastXMessages } from "../memory/chatlog-functions.js";
import { SlashCommandBuilder } from "discord.js";
import { Ollama } from "@langchain/community/llms/ollama";
import { PromptTemplate } from "@langchain/core/prompts";

const ollamaLlm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "llama3",
});

// Grabs the last X messages from the chat log of this channel and summarizes them then returns them to the chat
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("summarizelastx")
    .setDescription("Summarizes the last X messages in this channel")
    .addIntegerOption((option) =>
      option
        .setName("amount")
        .setDescription("How many messages shall be summarized?")
        .setRequired(true)
    );

  return command.toJSON();
};

const invoke = async (interaction) => {
  const amount = interaction.options.getInteger("amount");
  const messages = await getLastXMessages(interaction, amount);

  const questionTemplate = PromptTemplate.fromTemplate(`
      You are Tensor. Your job is to take your previous chat messages from the current conversation and summarize them so you can remember the conversation. Make sure to include the names of the other people in the conversation and the main points of the conversation. Strictly use the information provided in the chat messages. Just write the summary, do not start the message with an introduction or acknowledgment of this request.
  
      Example: John Smith and I discussed the upcoming project and decided to meet next week to finalize the details. We also talked about the new team member, Sarah, and how she will be contributing to the project.
  
      <context>
      {context}
      </context>
  `);

  const answerChain = questionTemplate.pipe(ollamaLlm);

  const llmResponse = await answerChain.invoke({
    context: fileContents,
  });
  interaction.reply({
    content: llmResponse,
    ephemeral: true,
  });
};

export { create, invoke };
