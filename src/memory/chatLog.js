import { db } from "./index.js";
import { logDetailedMessageVector } from "./vectorMemory.js";
import { contentCleaner } from "../helpers/utilities.js";

// try {
//   await logDetailedMessageVector(message, client, formattedMessage);
// } catch (error) {
//   console.error("Error logging detailed message vector:", error);
// }

export async function logDetailedMessage(message, client, formattedMessage) {
  const botName = client.user.username;

  const type = "message";

  const displayName = message.member
    ? message.member.displayName
    : message.author.globalName;

  const { id: userId, username, discriminator, avatar } = message.author;

  // Message information
  const {
    id: messageId,
    channelId,
    guildId, // This property distinguishes between DMs and server channel messages
    createdTimestamp,
    content,
    cleanContent: cleanContentOriginal,
    tts,
    nonce,
    attachments,
  } = message;

  // Clean the message content
  const cleanContent = contentCleaner(formattedMessage, botName);

  // Determine whether the message is a DM or a server message and insert accordingly
  if (!guildId) {
    // DM
    await db.run(
      `INSERT INTO dms (id, channel_id, created_timestamp, content, clean_content, author_id, user_name, global_name, type, tts, nonce, has_attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        messageId,
        channelId,
        createdTimestamp,
        content,
        cleanContent,
        userId,
        username,
        displayName || username,
        type,
        tts,
        nonce,
        attachments && attachments.size > 0,
      ]
    );
  } else {
    // Server channel message
    await db.run(
      `INSERT INTO messages (id, channel_id, guild_id, created_timestamp, content, clean_content, author_id, user_name, global_name, type, tts, nonce, has_attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        messageId,
        channelId,
        guildId,
        createdTimestamp,
        content,
        cleanContent,
        userId,
        username,
        displayName || username,
        type,
        tts,
        nonce,
        attachments && attachments.size > 0,
      ]
    );
  }

  // Check for attachments and insert them with a placeholder for description
  if (message.attachments && message.attachments.size > 0) {
    message.attachments.forEach(async (attachment) => {
      const { id: attachmentId, url } = attachment;

      await db.run(
        `
        INSERT INTO attachments (attachment_id, message_id, url, description)
        VALUES (?, ?, ?, ?);
      `,
        [attachmentId, messageId, url, null] // Using NULL as a placeholder for the description
      );
    });
  }
}

export async function logDetailedInteraction(interaction, string) {
  const botName = interaction.client.user.username;

  const type = "interaction";

  const displayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;

  const { id: userId, username, discriminator, avatar } = interaction.user;

  // Interaction information
  const {
    id: interactionId,
    channelId,
    guildId, // This property distinguishes between DMs and server channel messages
    createdTimestamp,
    tts,
    nonce,
    attachments,
  } = interaction;

  // Clean the message content
  const cleanContent = contentCleaner(string, botName);
  // if cleanContent is empty, return
  if (!cleanContent) return;

  // Determine whether the message is a DM or a server message and insert accordingly
  if (!guildId) {
    // DM
    await db.run(
      `INSERT INTO dms (id, channel_id, created_timestamp, content, clean_content, author_id, user_name, global_name, type, tts, nonce, has_attachments)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        interactionId,
        channelId,
        createdTimestamp,
        string,
        cleanContent,
        userId,
        username,
        displayName || username,
        type,
        tts,
        nonce,
        attachments && attachments.size > 0,
      ]
    );
  } else {
    // Server channel message
    await db.run(
      `INSERT INTO messages (id, channel_id, guild_id, created_timestamp, content, clean_content, author_id, user_name, global_name, type, tts, nonce, has_attachments)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?);`,
      [
        interactionId,
        channelId,
        guildId,
        createdTimestamp,
        string,
        cleanContent,
        userId,
        username,
        displayName || username,
        type,
        tts,
        nonce,
        attachments && attachments.size > 0,
      ]
    );
  }
}
