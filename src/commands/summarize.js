import { SlashCommandBuilder } from "discord.js";
import { getLastXMessages } from "../memory/chatlogFunctions.js";
import { logDetailedInteraction } from "../memory/chatLog.js";
import llmCall from "../chatlogic/llmCall.js";
import config from "../config.js";
import removeBotName from "../chatlogic/removeBotName.js";

const create = () => {
  const command = new SlashCommandBuilder()
    .setName("summarize")
    .setDescription("Summarizes the last X messages.")
    .addIntegerOption((option) =>
      option
        .setName("count")
        .setDescription("The number of previous messages to summarize")
        .setRequired(true)
    )
    .toJSON();

  return command;
};

const invoke = async (interaction) => {
  const count = interaction.options.getInteger("count");
  const client = interaction.client;

  try {
    const messages = await getLastXMessages(interaction, count);

    const formattedMessages = messages
      .map((msg) => {
        if (msg.name === client.user.username) {
          return `${config.specialTokens.botTurn}${msg.name}: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}${config.specialTokens.endOfTurn}`;
        } else {
          return `${config.specialTokens.userTurn}${msg.name}: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}${config.specialTokens.endOfTurn}`;
        }
      })
      .join("\n");

    const prompt = `${config.specialTokens.system}You are an AI assistant. Summarize the following messages.${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}${formattedMessages}${config.specialTokens.endOfTurn}${config.specialTokens.botTurn}\n`;

    const response = await llmCall(prompt, []);
    const actionString = `Used the summarize command for the last ${count} messages`;
    interaction.reply({
      content: response,
      ephemeral: false,
    });
    await logDetailedInteraction(interaction, actionString);
  } catch (error) {
    console.error("Failed to summarize messages:", error);
    interaction.reply({
      content: "Failed to summarize messages.",
      ephemeral: true,
    });
  }
};

export { create, invoke };
