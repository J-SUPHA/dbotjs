import { readFile } from "fs/promises";
import {
  interactionHistoryFormatter,
  historyFormatter,
} from "./historyFormatter.js";
import { getCurrentDateFormatted } from "../helpers/dateFormatter.js";
import { getLastXMessages } from "./chatlogFunctions.js";
import config from "../config.js";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from "@langchain/core/prompts";
import getMessageType from "../helpers/message-type.js";

async function channelType(message) {
  const user = message.member
    ? message.member.displayName
    : message.author.globalName;
  if (message.channel.guildId) {
    const guild = await message.client.guilds.fetch(message.channel.guildId);
    const channel = guild.channels.cache.get(message.channel.id);

    return "Server - " + guild.name + " Channel - " + channel.name;
  } else {
    return user + "'s DMs";
  }
}

async function interactionChannelType(interaction) {
  const user = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  if (interaction.channel.guildId) {
    // get name of server and channel
    const guild = await interaction.client.guilds.fetch(
      interaction.channel.guildId
    );
    const channel = guild.channels.cache.get(interaction.channel.id);

    return (
      "group chat on the server " +
      guild.name +
      ", in the channel " +
      channel.name
    );
  } else {
    return "a private DM with " + user;
  }
}

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

async function getMessageObjects(messages, client) {
  return messages.map((msg) =>
    msg.name === client.user.username
      ? new AIMessage(msg.clean_content)
      : new HumanMessage(`${msg.name}: ${msg.clean_content}`)
  );
}

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
