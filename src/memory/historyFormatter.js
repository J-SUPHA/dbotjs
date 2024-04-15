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
          return `<|im_start|>${msg.name}: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}<|im_end|>`;
        } else {
          // Format the message another way if names are different
          return `<|im_start|>${msg.name}: ${removeBotName(
            client.user.username,
            msg.clean_content
          )}<|im_end|>`;
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

// this is for the forcedPromptFormatter
export async function interactionHistoryFormatter(interaction) {
  const k = config.k;
  const channelType = getMessageType(interaction);

  try {
    const messages = await getLastXMessages(
      db,
      interaction.channelId,
      k,
      channelType
    );
    // Format the messages into a single string
    const formattedMessages = messages
      .map((msg) => {
        // Check if message.name is equal to client.user.username
        if (msg.name === interaction.client.user.username) {
          // Format the message one way if its a message from the bot
          return `<|im_start|>${msg.name}: ${removeBotName(
            interaction.client.user.username,
            msg.clean_content
          )}<|im_end|>`;
        } else {
          // Format the message another way if names are different
          return `<|im_start|>${msg.name}: ${removeBotName(
            interaction.client.user.username,
            msg.clean_content
          )}<|im_end|>`;
        }
      })
      .join("\n");
    console.log("formattedMessages", formattedMessages);
    return formattedMessages;
  } catch (error) {
    console.error(
      `Failed to format messages for ${channelType} with channel ID ${interaction.channelId}:`,
      error
    );
    throw error; // Or handle the error more gracefully if preferred
  }
}
