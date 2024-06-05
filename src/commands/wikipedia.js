import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";
import { OpenAI } from "@langchain/openai";
import { logDetailedInteraction } from "../memory/chatLog.js";
import config from "../config.js";
import sendMessageInParts from "../helpers/splitMessages.js";

const wikipediaSearchTool = new WikipediaQueryRun({
  topKResults: 1,
  maxDocContentLength: 10000,
});

const additionalStopTokens = [...config.openAIConfig.stop, ...["assistant\n"]];
const openAIConfig = {
  ...config.openAIConfig,
  openAIApiKey: config.llmApiKey,
  configuration: {
    baseURL: config.llmBaseUrl || "https://api.openai.com/v1",
  },
  baseURL: config.llmBaseUrl,
  stop: additionalStopTokens,
};
const openAIClient = new OpenAI(openAIConfig);

const invokeOpenAI = async (prompt, stopTokens) => {
  try {
    const response = await openAIClient.invoke(prompt, stopTokens);
    return response;
  } catch (error) {
    console.error("Error during LLM call:", error);
    throw new Error("Failed to get response from LLM.");
  }
};

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const createSlashCommand = () => {
  const command = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Search something on Wikipedia")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question to ask the AI.")
        .setRequired(true)
    );

  return command.toJSON();
};

const handleCommandInteraction = async (interaction) => {
  // await interaction.deferReply(); // Ensure the interaction is deferred
  const userDisplayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  const userQuestion = interaction.options.getString("question");
  const extractionPrompt = `${config.specialTokens.system}Only using the context below. Extract the subject from the user's question with no additional text or preamble. Do not answer the question.${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}${userQuestion}${config.specialTokens.endOfTurn}
${config.specialTokens.botTurn}\n`;
  console.log(extractionPrompt);

  const processInteraction = async () => {
    await interaction.deferReply(); // Ensure the interaction is deferred
    const extractedSubject = await invokeOpenAI(extractionPrompt, [
      "assistant\n",
    ]);
    console.log(extractedSubject);
    const wikipediaResults = await wikipediaSearchTool.invoke(extractedSubject);

    const answerPrompt = `${config.specialTokens.system}You are an AI assistant. Your job is to answer the user's question as best as you can using the search results.\n${wikipediaResults}${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}
    ${userQuestion}${config.specialTokens.endOfTurn}
    ${config.specialTokens.botTurn}\n`;

    // The embed will show the name of the user and the avatar of the user along with the question they asked
    const actionLogMessage = `Used the wikipedia command: '${extractedSubject}'`;
    await logDetailedInteraction(interaction, actionLogMessage);
    const responseEmbed = new EmbedBuilder()
      .setColor(0x0099ff) // Set a color for the embed
      .setTitle("Wikipedia Search") // The title of the embed
      .setAuthor({
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setDescription(`${interaction.user.username} asked: ${userQuestion}`) // The description of the embed
      .setTimestamp()
      .setFooter({
        text: "Wikipedia Search",
        iconURL: interaction.user.displayAvatarURL(),
      }); // The footer of the embed

    await interaction.followUp({
      embeds: [responseEmbed],
      ephemeral: false,
    });

    const answerResponse = await invokeOpenAI(answerPrompt, ["assistant\n"]);
    sendMessageInParts(interaction, answerResponse);
  };

  await processInteraction(); // Add await here
};

export { createSlashCommand as create, handleCommandInteraction as invoke };
