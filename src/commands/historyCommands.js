import { SlashCommandBuilder } from "discord.js";
import { historyFormatter } from "../memory/historyFormatter.js"; // Import the function

// Adjusts the command setup
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("history") // Changed from "ping" to "history"
    .setDescription("Retrieves the last X messages from the channel.")
    .addIntegerOption(
      (option) =>
        option
          .setName("count")
          .setDescription("How many messages to retrieve")
          .setRequired(true) // Making this option required
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
const invoke = (interaction) => {
  const count = interaction.options.getInteger("count"); // Retrieve the count from the interaction
  const messages = historyFormatter(interaction.channelId, count); // Call the function

  interaction.reply({ content: messages, ephemeral: true }); // Reply with the messages
};

export { create, invoke };
