import { getLastXMessages } from "../memory/chatLog.js";
import { SlashCommandBuilder } from "discord.js";

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

  // Reply with the summarized messages
  interaction.reply({
    content: messages,
    ephemeral: true,
  });
};

export { create, invoke };
