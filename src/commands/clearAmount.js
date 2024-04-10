import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { deleteMessages, deleteKMessages } from "../memory/chatLog.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("cleark")
    .setDescription(
      "Deletes the given amount of messages from the bot's memory!"
    )
    .addNumberOption((option) =>
      option
        .setName("amount")
        .setDescription("How many messages shall be deleted?")
        .setRequired(true)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  const amount = interaction.options.getNumber("amount");
  const deletedMessages = await deleteKMessages(interaction, amount);

  // Reply with a confirmation
  interaction.reply({
    content: `I deleted ${deletedMessages} messages for you!`,
    ephemeral: true,
  });
};

export { create, invoke };
