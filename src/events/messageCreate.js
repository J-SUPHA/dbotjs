import { processMessage } from "../memory/responseHandler.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import removeBotName from "../chatlogic/removeBotName.js";
import config from "../config.js";
import replaceEmojiNamesWithIds from "../helpers/replaceEmojiNamesWithIds.js";
import splitMessages from "../helpers/splitMessages.js";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// rus the message through the replaceEmojiNamesWithIds function then return the message
async function sendMessageInParts(message, content, client) {
  content = await replaceEmojiNamesWithIds(content, message.guild);
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
