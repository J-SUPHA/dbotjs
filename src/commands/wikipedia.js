import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { OpenAI } from "@langchain/openai";
import { logDetailedInteraction } from "../memory/chatLog.js";
import config from "../config.js";
import sendMessageInParts from "../helpers/splitMessages.js";
const searchTool = new WikipediaQueryRun({
  topKResults: 1,
  maxDocContentLength: 10000,
});

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
const llm = new OpenAI(openAIParams);

const llmCall = async (prompt, stopList) => {
  try {
    const response = await llm.invoke(prompt, stopList);
    return response;
  } catch (error) {
    console.error("Error during LLM call:", error);
    throw new Error("Failed to get response from LLM.");
  }
};

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Search Something on Wikipedia")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question to ask the AI.")
        .setRequired(true)
    );

  return command.toJSON();
};

const invoke = async (interaction) => {
  // await interaction.deferReply(); // Ensure the interaction is deferred
  const displayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  const example = interaction.options.getString("question");
  const searchQuery = `${config.specialTokens.system}Only using the context below. Extract the subject from the user's question with no additional text or preamble. Do not answer the question.${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}${example}${config.specialTokens.endOfTurn}
${config.specialTokens.botTurn}\n`;
  console.log(searchQuery);

  const handleInteraction = async () => {
    await interaction.deferReply(); // Ensure the interaction is deferred
    const response = await llmCall(searchQuery, ["assistant\n"]);
    console.log(response);
    const wikiResults = await searchTool.invoke(response);

    const answerQuery = `${config.specialTokens.system}You are an AI assistant. Your job is to answer the user's question as best as you can using the search results.\n${wikiResults}${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}
    ${example}${config.specialTokens.endOfTurn}
    ${config.specialTokens.botTurn}\n`;

    // The embed will show the name of the user and the avatar of the user along with the question they asked
    const actionString = `Used the wikipedia command: '${response}'`;
    await logDetailedInteraction(interaction, actionString);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff) // Set a color for the embed
      .setTitle("Wikipedia Search") // The title of the embed
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(`${interaction.user.username} asked: ${example}`) // The description of the embed
      .setTimestamp()
      .setFooter({
        text: "Wikipedia Search",
        iconURL: interaction.user.displayAvatarURL(),
      }); // The footer of the embed

    await interaction.followUp({
      embeds: [embed],
      ephemeral: false,
    });

    const answer = await llmCall(answerQuery, ["assistant\n"]);
    sendMessageInParts(interaction, answer);
  };

  await handleInteraction(); // Add await here
};

export { create, invoke };
