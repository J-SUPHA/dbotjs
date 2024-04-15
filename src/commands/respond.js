import { SlashCommandBuilder } from "discord.js";
import { forcedPromptFormatter } from "../memory/promptFormatter.js";
import removeBotName from "../chatlogic/removeBotName.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import llmCall from "../chatlogic/llmCall.js";

async function replaceEmojiNamesWithIds(text, guild) {
  // Regular expression to find words enclosed in ':'
  const regex = /:(\w+):/g;
  let match;

  // If guild is not available, return the text as is
  if (!guild) {
    return text;
  }

  // Loop through all matches in the text
  while ((match = regex.exec(text)) !== null) {
    // Get the emoji by name
    const emoji = guild.emojis.cache.find((e) => e.name === match[1]);
    if (emoji) {
      // Determine the prefix based on whether the emoji is animated
      const prefix = emoji.animated ? "a" : "";
      // Replace the matched text with the correct emoji format <a:name:id> for animated or <:name:id> for static
      text = text.replace(
        `:${match[1]}:`,
        `<${prefix}:${emoji.name}:${emoji.id}>`
      );
    }
  }
  return text;
}

function splitMessages(content, charLimit) {
  const parts = [];
  let currentPart = "";

  content.split(" ").forEach((word) => {
    if (currentPart.length + word.length + 1 > charLimit) {
      parts.push(currentPart);
      currentPart = word;
    } else {
      currentPart += `${currentPart.length > 0 ? " " : ""}${word}`;
    }
  });

  if (currentPart.length) {
    parts.push(currentPart);
  }
  return parts;
}

// rus the message through the replaceEmojiNamesWithIds function then return the message
async function sendMessageInParts(interaction, content) {
  content = await replaceEmojiNamesWithIds(content, interaction.guild);
  const CHAR_LIMIT = 2000;
  if (content.length <= CHAR_LIMIT) {
    const sentMessage = await interaction.channel.send(
      removeBotName(interaction.client.user.username, content)
    );
    await logDetailedMessage(
      sentMessage,
      interaction.client,
      sentMessage.cleanContent
    );
  } else {
    const messageParts = splitMessages(content, CHAR_LIMIT);
    for (const part of messageParts) {
      const sentMessage = await interaction.channel.send(
        removeBotName(interaction.client.user.username, part)
      );
      await logDetailedMessage(
        sentMessage,
        interaction.client,
        sentMessage.cleanContent
      );
      await delay(1000); // Wait for 1 second between message parts to avoid rate limiting
    }
  }
}

const create = () => {
  const command = new SlashCommandBuilder()
    .setName("respond")
    .setDescription("Responds with a generated response.")
    .toJSON(); // Ensure the command is properly formatted as JSON

  return command;
};
const invoke = async (interaction) => {
  // Defer the reply; this acknowledges the interaction but doesn't send a visible response
  await interaction.deferReply({ ephemeral: false });

  // Generate a prompt using some internal logic or context
  const prompt = await forcedPromptFormatter(interaction); // Assuming this function handles prompt generation
  const response = await llmCall(prompt, []);

  // Using channel.send() to send the response directly to the channel
  sendMessageInParts(interaction, response); // Assuming this function sends the message in parts if it exceeds the character limit (2000 characters

  // Optionally delete the defer message if you don't want any visible trace from the bot's initial interaction
  await interaction.deleteReply();
};

export { create, invoke };
