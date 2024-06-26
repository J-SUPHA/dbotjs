import getMessageType from "../helpers/message-type.js";
import { db } from "./index.js";
export async function deleteMessages(interaction) {
  let query;
  const channelType = await getMessageType(interaction);

  if (channelType === "dm") {
    query = `
      UPDATE dms
      SET use_in_memory = 0
      WHERE channel_id = ?
      AND use_in_memory = 1
      `;
  } else if (channelType === "channel") {
    query = `
      UPDATE messages
      SET use_in_memory = 0
      WHERE channel_id = ?
      AND use_in_memory = 1
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

  if (channelType === "dm") {
    query = `
      SELECT id
      FROM dms
      WHERE channel_id = ?
      ORDER BY created_timestamp DESC
      LIMIT ?
    `;
  } else if (channelType === "channel") {
    query = `
      SELECT id
      FROM messages
      WHERE channel_id = ?
      ORDER BY created_timestamp DESC
      LIMIT ?
    `;
  }

  try {
    // Fetch and log the IDs of messages to be updated
    const messagesToUpdate = await db.all(query, interaction.channelId, K);
    console.log(`Messages to update:`, messagesToUpdate);

    // Now perform the update
    if (channelType === "dm") {
      query = `
        UPDATE dms
        SET use_in_memory = 0
        WHERE id IN (
          SELECT id
          FROM dms
          WHERE channel_id = ?
          ORDER BY created_timestamp DESC
          LIMIT ?
        )
      `;
    } else if (channelType === "channel") {
      query = `
        UPDATE messages
        SET use_in_memory = 0
        WHERE id IN (
          SELECT id
          FROM messages
          WHERE channel_id = ?
          ORDER BY created_timestamp DESC
          LIMIT ?
        )
      `;
    }

    const result = await db.run(query, interaction.channelId, K);
    const updatedCount = result.changes;
    console.log(`Flagged ${updatedCount} messages as not to be used.`);
    return updatedCount;
  } catch (error) {
    console.error(
      `Error updating messages with channel ID ${interaction.channelId}:`,
      error
    );
    throw error;
  }
}

export async function getLastXMessages(channel_id, k, channelType) {
  let query;

  if (channelType === "dm") {
    query = `
        SELECT name, clean_content, caption FROM (
            SELECT COALESCE(global_name, user_name) AS name, clean_content, created_timestamp, caption
            FROM dms
            WHERE channel_id = ? AND use_in_memory = 1
            ORDER BY created_timestamp DESC
            LIMIT ?
        ) sub ORDER BY created_timestamp ASC
      `;
  } else if (channelType === "channel") {
    query = `
        SELECT name, clean_content, caption, FROM (
            SELECT COALESCE(global_name, user_name) AS name clean_content, created_timestamp, caption
            FROM messages
            WHERE channel_id = ? AND use_in_memory = 1
            ORDER BY created_timestamp DESC
            LIMIT ?
        ) sub ORDER BY created_timestamp ASC
      `;
  } else {
    throw new Error("Invalid channel type");
  }

  try {
    const messages = await db.all(query, channel_id, k);
    // console.log(messages);
    return messages;
  } catch (error) {
    console.error(
      `Error fetching messages for ${channelType} with channel ID ${channel_id}:`,
      error
    );
    throw error; // Rethrow the error after logging
  }
}
