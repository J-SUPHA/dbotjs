import { db } from "./index.js";
import removeBotName from "../chatlogic/removeBotName.js";

export async function historyFormatter(channel_id, botName, x) {
  async function getLastXMessages(db, channel_id, x) {
    // Retrieve the last X messages for a specified channel
    const query = `
          SELECT name, clean_content FROM (
              SELECT COALESCE(global_name, user_name) AS name, clean_content, created_timestamp
              FROM dms
              WHERE channel_id = ?
              ORDER BY created_timestamp DESC
              LIMIT ?
          ) sub ORDER BY created_timestamp ASC
      `;

    const messages = await db.all(query, channel_id, x);
    return messages;
  }

  const messages = await getLastXMessages(db, channel_id, x);
  // Format the messages into a single string
  const formattedMessages = messages
    .map(
      (message) =>
        `${message.name}: ${removeBotName(botName, message.clean_content)}`
    )
    .join("\n");
  return formattedMessages;
}
