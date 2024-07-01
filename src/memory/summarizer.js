import { getLastXMessages } from "./chatlogFunctions.js";
import { getMessageObjects } from "./promptFormatter.js";
import config from "../config.js";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import { getCurrentDateFormatted } from "../helpers/dateFormatter.js";
import { llmChatCall } from "../chatlogic/llmCall.js";
import getMessageType from "../helpers/messageType.js";
import { db } from "./index.js";

// To Do: change the code so that it summarizes messages outside the last K messages

export async function summarizationPromptFormatter(client, message) {
  const date = getCurrentDateFormatted();
  const channelType = await getMessageType(message);
  // number of messages to summarize
  const numberOfMessages = config.k;
  const history = await getLastXMessages(
    message.channelId,
    numberOfMessages,
    channelType
  );
  const name = client.user.username;
  const messageObjects = await getMessageObjects(history, client);

  const systemMessageContent = `You are a female AI named ${name}. You are tasked with summarizing Discord conversations for the purpose of being used as memory. The current date is ${date}. This is a ${channelType} channel.

  Instructions for summarization:
  1. Provide a brief overview of the main topics discussed.
  2. Highlight any important decisions or conclusions reached.
  3. Note any actions described by the person or notable details about people.
  4. Summarize in a concise, bullet-point format.
  5. Keep the summary under 300 words.

  Please summarize the following conversation:`;

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", systemMessageContent],
    new MessagesPlaceholder("messages"),
  ]);

  return { promptTemplate: prompt, messageObjects };
}

export async function handleSummarization(client, channelId, message) {
  const k = config.k;
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }

    const numberOfMessages = k; // Number of messages to summarize
    const channelType = await getMessageType(message);
    let history = await getLastXMessages(
      channelId,
      numberOfMessages * 2, // Fetch more messages to ensure we have enough new ones
      channelType
    );

    if (history.length === 0) {
      console.log(`No messages to summarize in channel ${channelId}`);
      return;
    }

    // Get the last summary for this channel
    const lastSummary = await db.get(
      `SELECT * FROM message_summaries 
       WHERE channel_id = ? 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [channelId]
    );

    // Filter out messages that have already been summarized
    if (lastSummary) {
      const summarizedMessageIds = JSON.parse(lastSummary.message_ids);
      history = history.filter((msg) => !summarizedMessageIds.includes(msg.id));
    }

    // Check if we have enough new messages to summarize
    if (history.length < numberOfMessages) {
      console.log(
        `Not enough new messages to summarize in channel ${channelId}. Current count: ${history.length}`
      );
      return;
    }

    // Take only the most recent 'numberOfMessages'
    history = history.slice(0, numberOfMessages);

    const messageIds = history.map((msg) => msg.id);

    console.log(
      `Summarizing ${numberOfMessages} messages in channel ${channelId} from ${
        messageIds[messageIds.length - 1]
      } to ${messageIds[0]}`
    );

    // Format the prompt for summarization
    const { promptTemplate, messageObjects } =
      await summarizationPromptFormatter(client, message);

    console.log("Preparing to summarize messages:");
    messageObjects.forEach((msg, index) => {
      console.log(
        `Message ${index + 1}: ${
          msg.constructor.name
        } - ${msg.content.substring(0, 50)}...`
      );
    });

    // Call the language model with the formatted prompt
    const summary = await llmChatCall(promptTemplate, messageObjects, [
      "\nSummary: ",
    ]);

    console.log("Generated summary:", summary.content);

    // Store the new summary in the SQL database
    await db.run(
      `INSERT INTO message_summaries (channel_id, guild_id, summary, message_ids, context)
       VALUES (?, ?, ?, ?, ?)`,
      [
        channelId,
        message.guildId || "dm",
        summary.content,
        JSON.stringify(messageIds),
        JSON.stringify({
          channelType: channelType,
          messageCount: numberOfMessages,
          date: getCurrentDateFormatted(),
        }),
      ]
    );

    console.log(
      `Summarization task completed and stored for channel ${channelId}`
    );
  } catch (error) {
    console.error("Error in summarization task:", error);
  }
}

async function shouldUpdateSummary(
  overlappingSummaries,
  startMessageId,
  endMessageId
) {
  // Implement logic to decide whether to update existing summaries
  // This could be based on the extent of overlap, time since last summary, etc.
  // For now, we'll always return true to update
  return true;
}

async function updateExistingSummaries(
  overlappingSummaries,
  channelId,
  startMessageId,
  endMessageId
) {
  // Implement logic to update or merge existing summaries
  // This could involve deleting old summaries and creating a new one, or updating existing ones
  // For simplicity, we'll delete old summaries and let the main function create a new one
  const idsToDelete = overlappingSummaries.map((summary) => summary.id);
  await db.run(
    `DELETE FROM message_summaries WHERE id IN (${idsToDelete.join(",")})`
  );
  console.log(
    `Deleted ${idsToDelete.length} overlapping summaries for channel ${channelId}`
  );
}
