import { db } from "./index.js";
import removeBotName from "../chatlogic/removeBotName.js";

export async function historyFormatter(channel_id, botName, x, channelType) {
  async function getLastXMessages(db, channel_id, x, channelType) {
    let query;

    if (channelType === "dm") {
      query = `
        SELECT name, clean_content FROM (
            SELECT COALESCE(global_name, user_name) AS name, clean_content, created_timestamp
            FROM dms
            WHERE channel_id = ?
            ORDER BY created_timestamp DESC
            LIMIT ?
        ) sub ORDER BY created_timestamp ASC
      `;
    } else if (channelType === "channel") {
      query = `
        SELECT name, clean_content FROM (
            SELECT COALESCE(global_name, user_name) AS name, clean_content, created_timestamp
            FROM messages
            WHERE channel_id = ?
            ORDER BY created_timestamp DESC
            LIMIT ?
        ) sub ORDER BY created_timestamp ASC
      `;
    } else {
      throw new Error("Invalid channel type");
    }

    try {
      const messages = await db.all(query, channel_id, x);
      return messages;
    } catch (error) {
      console.error(
        `Error fetching messages for ${channelType} with channel ID ${channel_id}:`,
        error
      );
      throw error; // Rethrow the error after logging
    }
  }

  try {
    const messages = await getLastXMessages(db, channel_id, x, channelType);
    // Format the messages into a single string
    const formattedMessages = messages
      .map(
        (message) =>
          `${message.name}: ${removeBotName(botName, message.clean_content)}`
      )
      .join("\n");

    return formattedMessages;
  } catch (error) {
    console.error(
      `Failed to format messages for ${channelType} with channel ID ${channel_id}:`,
      error
    );
    throw error; // Or return a default value like return "Error formatting messages.";
  }
}
