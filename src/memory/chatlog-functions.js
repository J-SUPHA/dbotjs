import getMessageType from "../utils/message-type.js";
import { db } from "./index.js";

export async function deleteMessages(interaction) {
  let query;
  const channelType = await getMessageType(interaction);
  // console.log(channelType);
  // console.log(interaction.channelId);

  if (channelType === "dm") {
    query = `
      DELETE FROM dms 
      WHERE channel_id = ?
      `;
  } else if (channelType === "channel") {
    query = `
      DELETE FROM messages 
      WHERE channel_id = ?
      `;
  }

  try {
    // Assuming db.run() resolves with an object that includes a property for the affected row count
    const result = await db.run(query, interaction.channelId);
    // The property name might be `changes`, `rowCount`, or something else depending on your DB interface
    const deletedCount = result.changes; // This is for sqlite3, adjust according to your DB interface

    console.log(`Deleted ${deletedCount} messages.`);
    return deletedCount;
  } catch (error) {
    console.error(
      `Error deleting messages with channel ID ${interaction.channelId}:`,
      error
    );
    throw error;
  }
}

export async function deleteKMessages(interaction, K) {
  let query;
  const channelType = await getMessageType(interaction);
  // console.log(channelType);
  // console.log(interaction.channelId);
  // console.log(message.ch);

  if (channelType === "dm") {
    query = `
      DELETE FROM dms 
          WHERE channel_id = ?
          AND id IN (
              SELECT id
              FROM dms
              WHERE channel_id = ?
              ORDER BY created_timestamp DESC
              LIMIT ?
          )
      `;
  } else if (channelType === "channel") {
    query = `
      DELETE FROM messages 
          WHERE channel_id = ?
          AND id IN (
              SELECT id
              FROM messages
              WHERE channel_id = ?
              ORDER BY created_timestamp DESC
              LIMIT ?
          )
      `;
  }

  try {
    const result = await db.run(
      query,
      interaction.channelId,
      interaction.channelId,
      K
    );
    // The property name might be `changes`, `rowCount`, or something else depending on your DB interface
    const deletedCount = result.changes; // This is for sqlite3, adjust according to your DB interface
    console.log(`Deleted ${deletedCount} messages.`);
    return deletedCount;
  } catch (error) {
    console.error(
      `Error deleting message with ID ${interaction.channelId}:`,
      error
    );
    throw error;
  }
}

export async function getLastXMessages(message, k) {
  let query;
  const channelType = await getMessageType(message);
  const channel_id = message.channelId;

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
    const messages = await db.all(query, channel_id, k);
    return messages;
  } catch (error) {
    console.error(
      `Error fetching messages for ${channelType} with channel ID ${channel_id}:`,
      error
    );
    throw error; // Rethrow the error after logging
  }
}
