import { db } from "./index.js";
import removeBotName from "../chatlogic/removeBotName.js";
import { getLastXMessages } from "./chatLog.js";
import config from "../config.js";

function getMessageType(message) {
  if (message.channel.guildId) {
    return "channel";
  } else {
    return "dm";
  }
}

export async function historyFormatter(message, client) {
  const k = config.k;
  const channelType = getMessageType(message);

  try {
    const messages = await getLastXMessages(
      db,
      message.channelId,
      k,
      channelType
    );
    // Format the messages into a single string
    const formattedMessages = messages
      .map(
        (message) =>
          `${message.name}: ${removeBotName(
            client.user.username,
            message.clean_content
          )}`
      )
      .join("\n");

    return formattedMessages;
  } catch (error) {
    console.error(
      `Failed to format messages for ${channelType} with channel ID ${message.channelId}:`,
      error
    );
    throw error; // Or return a default value like return "Error formatting messages.";
  }
}
