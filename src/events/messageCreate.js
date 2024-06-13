import { processMessage } from "../memory/responseHandler.js";
import config from "../config.js";
import { sendMessageInParts } from "../helpers/splitMessages.js";

// const CHAR_LIMIT = 2000;

// async function sendMessageInParts(message, content, client) {
//   try {
//     content = await replaceEmojiNamesWithIds(content, message.guild);
//     if (typeof content !== "string") {
//       throw new TypeError("Content must be a string");
//     }

//     if (content.length <= CHAR_LIMIT) {
//       const sentMessage = await message.channel.send(
//         removeBotName(client.user.username, content)
//       );
//       await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
//     } else {
//       const messageParts = splitMessages(content, CHAR_LIMIT);
//       for (const part of messageParts) {
//         const sentMessage = await message.channel.send(
//           removeBotName(client.user.username, part)
//         );
//         await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
//       }
//     }
//   } catch (error) {
//     console.error("Failed to send message parts:", error);
//   }
// }

export default {
  name: "messagecreate",
  async execute(message, client) {
    if (shouldIgnoreMessage(message, client)) {
      return;
    }

    try {
      const messageContent = await processMessage(message, client);

      if (!messageContent) {
        return;
      }

      await sendMessageInParts(message, messageContent, client);
    } catch (error) {
      console.error("Error processing message:", error);
    }
  },
};

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
