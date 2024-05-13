import { SlashCommandBuilder } from "discord.js";
import { deleteMessages } from "../memory/chatlog-functions.js";

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
  // delete the reply after 10 seconds
  interaction.reply({
    content: `Deleted ${totalDeleted} messages.`,
    ephemeral: true,
  });
  setTimeout(() => {
    interaction.deleteReply();
  }, 5000);
};

export { create, invoke };
