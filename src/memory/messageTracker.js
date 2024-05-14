import { db } from "./index.js";
import { getLastXMessages } from "./chatlog-functions.js";
import llmCall from "../chatlogic/llmCall.js";
import config from "../config.js";
import removeBotName from "../chatlogic/removeBotName.js";
import getMessageType from "../utils/message-type.js";

const MESSAGE_THRESHOLD = 10; // Number of messages to trigger a summary

// Function to get the current timestamp in seconds
const getCurrentTimestamp = () => Math.floor(Date.now() / 1000);

// Function to insert a summary into the database
const insertSummary = async (
  channelId,
  messageIds,
  userIds,
  summaryText,
  tags = ""
) => {
  const createdAt = getCurrentTimestamp();
  const query = `INSERT INTO summaries (channel_id, message_ids, user_ids, summary_text, created_at, tags) 
                 VALUES (?, ?, ?, ?, ?, ?)`;
  const params = [
    channelId,
    JSON.stringify(messageIds),
    JSON.stringify(userIds),
    summaryText,
    createdAt,
    tags,
  ];

  await db.run(query, params);
};

// Function to update message count in the database
const updateMessageCount = async (channelId) => {
  const querySelect = `SELECT message_count FROM message_counts WHERE channel_id = ?`;
  const result = await db.get(querySelect, [channelId]);

  let messageCount = result ? result.message_count : 0;
  messageCount++;

  const queryUpsert = `
    INSERT INTO message_counts (channel_id, message_count)
    VALUES (?, ?)
    ON CONFLICT(channel_id)
    DO UPDATE SET message_count = excluded.message_count
  `;
  await db.run(queryUpsert, [channelId, messageCount]);

  return messageCount >= MESSAGE_THRESHOLD;
};

// Function to format and summarize messages
const formatAndSummarizeMessages = async (messages, client) => {
  const formattedMessages = messages
    .map((msg) => {
      if (msg.name === client.user.username) {
        return `${config.specialTokens.botTurn}${msg.name}: ${removeBotName(
          client.user.username,
          msg.clean_content
        )}${config.specialTokens.endOfTurn}`;
      } else {
        return `${config.specialTokens.userTurn}${msg.name}: ${removeBotName(
          client.user.username,
          msg.clean_content
        )}${config.specialTokens.endOfTurn}`;
      }
    })
    .join("\n");

  const prompt = `${config.specialTokens.system}You are an AI assistant. Summarize the following messages.${config.specialTokens.endOfTurn}${config.specialTokens.userTurn}${formattedMessages}${config.specialTokens.endOfTurn}${config.specialTokens.botTurn}\nSummary of messages:`;

  return await llmCall(prompt, []);
};

// Function to handle new messages
export const handleMessage = async (message, client) => {
  const channelId = message.channelId;
  console.log(message);
  const messageType = getMessageType(message);

  try {
    const querySelect = `SELECT message_count FROM message_counts WHERE channel_id = ?`;
    const result = await db.get(querySelect, [channelId]);

    let shouldSummarize = false;
    if (!result) {
      shouldSummarize = true; // No entry means we need to summarize initially
    } else {
      shouldSummarize = await updateMessageCount(channelId);
    }

    if (shouldSummarize) {
      const messages = await getLastXMessages(message, MESSAGE_THRESHOLD);
      const messageIds = messages.map((msg) => msg.id);
      const userIds = [...new Set(messages.map((msg) => msg.user_id))]; // Unique user IDs

      const summaryText = await formatAndSummarizeMessages(messages, client);
      await insertSummary(channelId, messageIds, userIds, summaryText);

      // Reset the message count after summarization
      const queryReset = `
        INSERT INTO message_counts (channel_id, message_count)
        VALUES (?, 0)
        ON CONFLICT(channel_id)
        DO UPDATE SET message_count = 0
      `;
      await db.run(queryReset, [channelId]);
    }
  } catch (error) {
    console.error(`Failed to handle message:`, error);
  }
};
