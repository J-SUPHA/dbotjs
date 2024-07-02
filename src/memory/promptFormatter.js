import { readFile } from "fs/promises";
import {
  interactionHistoryFormatter,
  historyFormatter,
} from "./historyFormatter.js";
import { getCurrentDateFormatted } from "../helpers/dateFormatter.js";
import { getLastXMessages } from "./chatlogFunctions.js";
import config from "../config.js";
import { ChatMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import getMessageType from "../helpers/messageType.js";
import {
  interactionChannelType,
  channelType,
} from "../helpers/promptHelpers.js";
import { db } from "./index.js";

const loadAndFormatTemplate = async (filePath) => {
  try {
    const template = await readFile(filePath, "utf8");
    return (replacements) =>
      Object.entries(replacements).reduce((acc, [placeholder, value]) => {
        const regex = new RegExp(`{{${placeholder}}}`, "g");
        return acc.replace(regex, value);
      }, template);
  } catch (error) {
    console.error("Error loading and formatting template:", error);
    throw error;
  }
};

export async function getMessageObjects(messages, client) {
  return messages.map((msg) =>
    msg.name === client.user.username
      ? new ChatMessage({
          name: msg.name,
          content: `${msg.name}: ${msg.clean_content}`,
          role: "assistant",
        })
      : new ChatMessage({
          name: msg.name,
          content: `${msg.name}: ${msg.clean_content}${
            msg.caption ? `<image>${msg.caption}</image>` : ""
          }`,
          role: "user",
        })
  );
}

// export async function systemPromptFormatter(message, client) {
//   try {
//     const k = config.k;

//     const date = getCurrentDateFormatted();
//     const filePath = "prompt.txt";
//     const channeltype = await getMessageType(message);
//     const history = await getLastXMessages(message.channelId, k, channeltype);
//     const messageObjects = await getMessageObjects(history, client);
//     const user = message.member
//       ? message.member.displayName
//       : message.author.globalName;
//     const char = client.user.username;
//     const templateFormatter = await loadAndFormatTemplate(filePath);

//     const systemMessageContent = templateFormatter({
//       char,
//       user,
//       date,
//       channeltype,
//     });

//     const prompt = ChatPromptTemplate.fromMessages([
//       ["system", systemMessageContent],
//       new MessagesPlaceholder("messages"),
//     ]);

//     return { promptTemplate: prompt, messageObjects };
//   } catch (error) {
//     console.error("Error formatting system prompt:", error);
//     throw error;
//   }
// }
export async function systemPromptFormatter(message, client) {
  try {
    const k = config.k;

    const date = getCurrentDateFormatted();
    const filePath = "prompt.txt";
    const channeltype = await getMessageType(message);
    const history = await getLastXMessages(message.channelId, k, channeltype);
    const messageObjects = await getMessageObjects(history, client);
    const user = message.member
      ? message.member.displayName
      : message.author.globalName;
    const char = client.user.username;
    const templateFormatter = await loadAndFormatTemplate(filePath);

    const systemMessageContent = templateFormatter({
      char,
      user,
      date,
      channeltype,
    });

    // Get the oldest message ID in the current history
    const oldestMessageId = history[history.length - 1].id;

    // Get the second-to-last summary that doesn't overlap with the current history
    const relevantSummary = await db.get(
      `SELECT * FROM message_summaries 
       WHERE channel_id = ? 
       AND JSON_EXTRACT(context, '$.messageCount') <= ?
       AND JSON_ARRAY_LENGTH(JSON_EXTRACT(message_ids, '$')) > 0
       AND JSON_EXTRACT(message_ids, '$[0]') < ?
       ORDER BY created_at DESC 
       LIMIT 1 OFFSET 1`,
      [message.channelId, k, oldestMessageId]
    );

    let prompt;
    if (relevantSummary) {
      prompt = ChatPromptTemplate.fromMessages([
        ["system", systemMessageContent],
        ["system", `Previous conversation summary: ${relevantSummary.summary}`],
        new MessagesPlaceholder("messages"),
      ]);
    } else {
      prompt = ChatPromptTemplate.fromMessages([
        ["system", systemMessageContent],
        new MessagesPlaceholder("messages"),
      ]);
    }
    // console.log("Prompt Template:", JSON.stringify(prompt, null, 2));
    // console.log("Message Objects:", JSON.stringify(messageObjects, null, 2));

    return { promptTemplate: prompt, messageObjects };
  } catch (error) {
    console.error("Error formatting system prompt:", error);
    throw error;
  }
}

export async function forcedInteractionPromptFormatter(interaction) {
  try {
    const k = config.k;

    const date = getCurrentDateFormatted();
    const filePath = "prompt.txt";
    const channeltype = await getMessageType(interaction);
    const history = await getLastXMessages(
      interaction.channelId,
      k,
      channeltype
    );
    const messageObjects = await getMessageObjects(history, interaction.client);
    const user = interaction.member
      ? interaction.member.displayName
      : interaction.user.globalName;
    const char = interaction.client.user.username;
    const templateFormatter = await loadAndFormatTemplate(filePath);

    const systemMessageContent = templateFormatter({
      char,
      user,
      date,
      channeltype,
    });

    const prompt = ChatPromptTemplate.fromMessages([
      ["system", systemMessageContent],
      new MessagesPlaceholder("messages"),
    ]);

    return { promptTemplate: prompt, messageObjects };
  } catch (error) {
    console.error("Error formatting system prompt:", error);
    throw error;
  }
}

// the below functions are used for completions and not chat-completions

export async function promptFormatter(message, client, formattedMessage) {
  try {
    const history = await historyFormatter(message, client);

    // console.log("History:", history);
    const date = getCurrentDateFormatted();
    const filePath = "prompt.txt";
    const channeltype = await channelType(message);
    const user = message.member
      ? message.member.displayName
      : message.author.globalName;
    const char = client.user.username;
    const templateFormatter = await loadAndFormatTemplate(filePath);

    const formattedPrompt = templateFormatter({
      char,
      user,
      history,
      date,
      channeltype,
    });

    const formattedBotMessage = `${config.specialTokens.botTurn}${char}:`;
    const finalPrompt = `${formattedPrompt}\n${formattedBotMessage}`;
    return finalPrompt;
  } catch (error) {
    console.error("Error formatting prompt:", error);
    throw error;
  }
}

// this function doesn't return the prompt with a formattedUserMessage, it just returns the formattedPrompt
export async function forcedPromptFormatter(interaction) {
  try {
    const history = await interactionHistoryFormatter(interaction);
    const date = getCurrentDateFormatted();
    const filePath = "prompt.txt";
    const channeltype = await interactionChannelType(interaction);
    const user = interaction.member
      ? interaction.member.displayName
      : interaction.user.globalName;
    const char = interaction.client.user.username;
    const templateFormatter = await loadAndFormatTemplate(filePath);

    const formattedPrompt = templateFormatter({
      char,
      user,
      history,
      date,
      channeltype,
    });
    const formattedBotMessage = `${config.specialTokens.botTurn}${char}:`;
    const finalPrompt = `${formattedPrompt}\n${formattedBotMessage}`;
    return finalPrompt;
  } catch (error) {
    console.error("Error formatting prompt:", error);
    throw error;
  }
}
