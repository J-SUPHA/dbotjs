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
      .map((msg) => {
        // Check if message.name is equal to client.user.username
        if (msg.name === client.user.username) {
          // Format the message one way if its a message from the bot
          return `<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|>${
            msg.name
          }: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}<|END_OF_TURN_TOKEN|>`;
        } else {
          // Format the message another way if names are different
          return `<|START_OF_TURN_TOKEN|><|USER_TOKEN|>${
            msg.name
          }: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}<|END_OF_TURN_TOKEN|>`;
        }
      })
      .join("\n");

    return formattedMessages;
  } catch (error) {
    console.error(
      `Failed to format messages for ${channelType} with channel ID ${message.channelId}:`,
      error
    );
    throw error; // Or handle the error more gracefully if preferred
  }
}
