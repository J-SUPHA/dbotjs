import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { deleteKMessages } from "../memory/chatlog-functions.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("summarize")
    .setDescription("Summarizes the last k messages in the channel.")
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("How many messages shall be summarized?")
        .setRequired(true)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  const amount = interaction.options.getNumber("amount");

  // Reply with a confirmation
  interaction.reply({
    content: `Pretend I summarized ${amount} messages for you!`,
    ephemeral: true,
  });
  setTimeout(() => {
    interaction.deleteReply();
  }, 5000);
};

export { create, invoke };
