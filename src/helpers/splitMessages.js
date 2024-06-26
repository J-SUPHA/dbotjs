import { replaceEmojiNamesWithIds } from "../helpers/utilities.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import removeBotName from "../chatlogic/removeBotName.js";

// Helper function to create a delay
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitMessages(content, charLimit) {
  console.log("splitMessages content:", content);
  try {
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
  } catch (error) {
    console.error("Error splitting messages:", error);
    return [];
  }
}

// rus the message through the replaceEmojiNamesWithIds function then return the message
export async function sendInteractionMessageInParts(interaction, content) {
  content = await replaceEmojiNamesWithIds(content, interaction.guild);
  const CHAR_LIMIT = 2000;
  if (content.length <= CHAR_LIMIT) {
    const sentMessage = await interaction.channel.send(
      removeBotName(interaction.client.user.username, content)
    );
    await logDetailedMessage(
      sentMessage,
      interaction.client,
      sentMessage.cleanContent,
      ""
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
        sentMessage.cleanContent,
        ""
      );
      await delay(1000); // Wait for 1 second between message parts to avoid rate limiting
    }
  }
}

export async function prepareMessageParts(content, guild, botUsername) {
  const CHAR_LIMIT = 2000;
  try {
    content = await replaceEmojiNamesWithIds(content, guild);
    if (typeof content !== "string") {
      throw new TypeError("Content must be a string");
    }

    content = removeBotName(botUsername, content);

    if (content.length <= CHAR_LIMIT) {
      return [content];
    } else {
      return splitMessages(content, CHAR_LIMIT);
    }
  } catch (error) {
    console.error("Failed to prepare message parts:", error);
    return [];
  }
}
