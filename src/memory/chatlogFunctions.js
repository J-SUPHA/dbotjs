import getMessageType from "../helpers/messageType.js";
import { db } from "./index.js";

export async function deleteSummaries(interaction) {
  const query = `
    UPDATE message_summaries
    SET use_in_memory = 0
    WHERE channel_id = ?
    AND use_in_memory = 1
  `;

  try {
    const result = await db.run(query, interaction.channelId);
    const updatedCount = result.changes; // Adjust according to your DB interface

    console.log(`Updated ${updatedCount} message summaries.`);
    return updatedCount;
  } catch (error) {
    console.error(
      `Error updating message summaries with channel ID ${interaction.channelId}:`,
      error
    );
    throw error;
  }
}

export async function deleteMessages(interaction) {
  const query = `
    UPDATE messages
    SET use_in_memory = 0
    WHERE channel_id = ?
    AND use_in_memory = 1
  `;

  try {
    const result = await db.run(query, interaction.channelId);
    const deletedCount = result.changes; // Adjust according to your DB interface

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
  const query = `
    SELECT id
    FROM messages
    WHERE channel_id = ?
    ORDER BY created_timestamp DESC
    LIMIT ?
  `;

  try {
    // Fetch and log the IDs of messages to be updated
    const messagesToUpdate = await db.all(query, interaction.channelId, K);
    console.log(`Messages to update:`, messagesToUpdate);

    // Now perform the update
    const updateQuery = `
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

    const result = await db.run(updateQuery, interaction.channelId, K);
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
  const query = `
    SELECT id, name, clean_content, created_timestamp, caption FROM (
        SELECT id, COALESCE(global_name, user_name) AS name, clean_content, created_timestamp, caption
        FROM messages
        WHERE channel_id = ? AND use_in_memory = 1
        ORDER BY created_timestamp DESC
        LIMIT ?
    ) sub ORDER BY created_timestamp ASC
  `;

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
