import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { deleteMessages } from "../memory/chatLog.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Clears the bot's entire message history.");

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = async (interaction) => {
  //   console.log(interaction);
  const totalDeleted = await deleteMessages(interaction);

  // Reply with a confirmation
  interaction.reply({
    content: `${totalDeleted} Messages cleared`,
    ephemeral: false,
  });
};

export { create, invoke };
