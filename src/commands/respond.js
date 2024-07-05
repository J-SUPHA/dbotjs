import { SlashCommandBuilder } from "discord.js";
import { forcedInteractionPromptFormatter } from "../memory/promptFormatter.js";
import removeBotName from "../helpers/removeBotName.js";
import { llmCall, llmChatCall } from "../chatlogic/llmCall.js";

import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

// This function forces the bot to respond using the current context
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("respond")
    .setDescription("Responds with a generated response.")
    .toJSON(); // Ensure the command is properly formatted as JSON

  return command;
};
const invoke = async (interaction) => {
  console.log(interaction);
  // Defer the reply; this acknowledges the interaction but doesn't send a visible response
  await interaction.deferReply(); // Ensure the interaction is deferred
  // Generate a prompt using some internal logic or context
  const userName = interaction.user.globalName;
  const botName = interaction.client.user.username;

  const { promptTemplate, messageObjects } =
    await forcedInteractionPromptFormatter(interaction);

  const chainResponse = await llmChatCall(promptTemplate, messageObjects, [
    `${userName}: `,
    `${botName}: `,
  ]);
  // Using channel.send() to send the response directly to the channel
  sendInteractionMessageInParts(interaction, chainResponse); // Assuming this function sends the message in parts if it exceeds the character limit (2000 characters

  // Optionally delete the defer message if you don't want any visible trace from the bot's initial interaction
  await interaction.deleteReply();
};

export { create, invoke };
