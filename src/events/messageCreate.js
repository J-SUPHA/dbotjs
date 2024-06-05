import { processMessage } from "../memory/responseHandler.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import removeBotName from "../chatlogic/removeBotName.js";
import config from "../config.js";
import { replaceEmojiNamesWithIds } from "../helpers/utilities.js";
import { splitMessages, delay } from "../helpers/utilities.js";

// Constants
const CHAR_LIMIT = 2000;

// Function to send a message in parts if it exceeds the character limit
async function sendMessageInParts(message, content, client) {
  try {
    content = await replaceEmojiNamesWithIds(content, message.guild);
    if (typeof content !== "string") {
      throw new TypeError("Content must be a string");
    }

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
        await delay(1000); // Throttle sending to avoid rate limits
      }
    }
  } catch (error) {
    console.error("Failed to send message parts:", error);
  }
}

// main event handler for messagees
export default {
  name: "messagecreate",
  async execute(message, client) {
    // Ignore messages per the function defined below
    if (shouldIgnoreMessage(message, client)) {
      return;
    }
    // Process the message and send the response
    try {
      const messageContent = await processMessage(message, client);
      // If there is no message content, return
      if (!messageContent) {
        return;
      }

      // Send the message in parts if it exceeds the character limit
      await sendMessageInParts(message, messageContent, client);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  },
};
// Function to check if the message should be ignored
// if it's from the bot, in a channel that isn't whitelisted,
// or starts with an ignored pattern
function shouldIgnoreMessage(message, client) {
  return (
    (message.channel.guildId &&
      !config.channelIds.includes(message.channelId)) ||
    message.author.username === client.user.username ||
    config.ignorePatterns.some((pattern) =>
      message.cleanContent.startsWith(pattern)
    )
  );
}
