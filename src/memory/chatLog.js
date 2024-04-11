import { db } from "./index.js";
import getMessageType from "../helpers/messageType.js";

function contentCleaner(message, botName) {
  if (message.startsWith(`@${botName}`)) {
    return message.replace(new RegExp(`@${botName}`, "gi"), "").trim();
  } else {
    return message.replace("@", "").trim();
  }
}

export async function deleteMessages(interaction) {
  let query;
  const channelType = await getMessageType(interaction);
  console.log(channelType);
  console.log(interaction.channelId);

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
  console.log(channelType);
  console.log(interaction.channelId);
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
            FROM dms
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

export async function getLastXMessages(db, channel_id, k, channelType) {
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

export async function createTables() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT,
      discriminator TEXT,
      avatar TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      guild_id TEXT,
      created_timestamp INTEGER,
      content TEXT,
      clean_content TEXT,
      author_id TEXT,
      user_name TEXT,
      global_name TEXT,
      pinned BOOLEAN,
      tts BOOLEAN,
      nonce TEXT,
      has_attachments BOOLEAN,
      image_caption TEXT,
      FOREIGN KEY (author_id) REFERENCES users (id)
    );
    
    CREATE TABLE IF NOT EXISTS dms (
      id TEXT PRIMARY KEY,
      channel_id TEXT,
      created_timestamp INTEGER,
      content TEXT,
      clean_content TEXT,
      author_id TEXT,
      user_name TEXT,
      global_name TEXT,
      pinned BOOLEAN,
      tts BOOLEAN,
      nonce TEXT,
      has_attachments BOOLEAN,
      image_caption TEXT,
      FOREIGN KEY (author_id) REFERENCES users (id)
    );
    CREATE TABLE IF NOT EXISTS attachments (
      attachment_id TEXT PRIMARY KEY,
      message_id TEXT,
      url TEXT,
      description TEXT,
      FOREIGN KEY (message_id) REFERENCES dms (id)
    );
    

    CREATE TABLE IF NOT EXISTS mentions (
      message_id TEXT,
      user_id TEXT,
      mentions_everyone BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (message_id) REFERENCES messages (id),
      FOREIGN KEY (user_id) REFERENCES users (id),
      PRIMARY KEY (message_id, user_id)
    );
    
    CREATE TABLE IF NOT EXISTS role_mentions (
      message_id TEXT,
      role_id TEXT,
      FOREIGN KEY (message_id) REFERENCES messages (id),
      PRIMARY KEY (message_id, role_id)
    );
    
    CREATE TABLE IF NOT EXISTS channel_mentions (
      message_id TEXT,
      channel_id TEXT,
      FOREIGN KEY (message_id) REFERENCES messages (id),
      PRIMARY KEY (message_id, channel_id)
    );
  `);
}

export async function logDetailedMessage(message, client, formattedMessage) {
  const botName = client.user.username;

  const displayName = message.member
    ? message.member.displayName
    : message.author.globalName;

  const { id: userId, username, discriminator, avatar } = message.author;

  // Insert user information, avoiding duplicates
  await db.run(
    `INSERT INTO users (id, username, discriminator, avatar)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       username=excluded.username,
       discriminator=excluded.discriminator,
       avatar=excluded.avatar;`,
    [userId, username, discriminator, avatar]
  );

  // Message information
  const {
    id: messageId,
    channelId,
    guildId, // This property distinguishes between DMs and server channel messages
    createdTimestamp,
    content,
    cleanContent: cleanContentOriginal,
    pinned,
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
      `INSERT INTO dms (id, channel_id, created_timestamp, content, clean_content, author_id, user_name, global_name, pinned, tts, nonce, has_attachments)
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
        pinned,
        tts,
        nonce,
        attachments && attachments.size > 0,
      ]
    );
  } else {
    // Server channel message
    await db.run(
      `INSERT INTO messages (id, channel_id, guild_id, created_timestamp, content, clean_content, author_id, user_name, global_name, pinned, tts, nonce, has_attachments)
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
        pinned,
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

  // Log user mentions with "mentions_everyone" flag
  message.mentions.users.forEach(async (user) => {
    await db.run(
      `
        INSERT INTO mentions (message_id, user_id, mentions_everyone)
        VALUES (?, ?, ?)
        ON CONFLICT(message_id, user_id) DO UPDATE SET mentions_everyone = excluded.mentions_everyone;
      `,
      [message.id, user.id, message.mentions.everyone]
    );
  });

  // Log role mentions
  message.mentions.roles.forEach(async (role) => {
    await db.run(
      `
        INSERT INTO role_mentions (message_id, role_id)
        VALUES (?, ?)
        ON CONFLICT(message_id, role_id) DO NOTHING;
      `,
      [message.id, role.id]
    );
  });

  // Log channel mentions
  message.mentions.channels.forEach(async (channel) => {
    await db.run(
      `
        INSERT INTO channel_mentions (message_id, channel_id)
        VALUES (?, ?)
        ON CONFLICT(message_id, channel_id) DO NOTHING;
      `,
      [message.id, channel.id]
    );
  });
}
