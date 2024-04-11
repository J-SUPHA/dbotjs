import { processMessage } from "../memory/responseHandler.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import removeBotName from "../chatlogic/removeBotName.js";
import config from "../config.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

// Processes and sends message content, handling Discord's character limit.
async function sendMessageInParts(message, content, client) {
  const CHAR_LIMIT = 2000;
  if (content.length <= CHAR_LIMIT) {
    const sentMessage = await message.channel.send(
      removeBotName(client.user.username, content)
    );
    await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
  } else {
    const messageParts = splitMessages(content, CHAR_LIMIT);
    for (const part of messageParts) {
      const sentMessage = await message.channel.send(
        removeBotName(client.user.username, part)
      );
      await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
      await delay(1000); // Wait for 1 second between message parts to avoid rate limiting
    }
  }
}

export default {
  name: "messagecreate",
  async execute(message, client) {
    // Determine if the message should be ignored based on several criteria
    if (
      // Check if the message is from the configured channels
      (message.channel.guildId &&
        !config.channelIds.includes(message.channelId)) ||
      // Check if the message is from this bot itself
      message.author.username === client.user.username ||
      // Check if the message starts with any configured ignore patterns
      config.ignorePatterns.some((pattern) =>
        message.cleanContent.startsWith(pattern)
      )
    ) {
      return; // Ignore messages from unwanted channels, from itself, or starting with ignore patterns
    }

    let messageContent;
    try {
      messageContent = await processMessage(message, client);
      if (typeof messageContent !== "string" || messageContent.trim() === "") {
        return;
      }
    } catch (error) {
      console.error("Error processing message:", error);
      return; // Exit if processing fails
    }

    await sendMessageInParts(message, messageContent, client); // Handle sending message considering the character limit
  },
};
