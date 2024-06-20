import { promises as fs } from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { createTables } from "#memory/createdb";
import { processMessage } from "../memory/responseHandler.js";
import config from "../config.js";
import {} from "dotenv/config"; // Import dotenv to use environment variables
import { shouldReply } from "../helpers/shouldReply.js";
import { forcedInteractionPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "../chatlogic/llmCall.js";
import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

const INACTIVITY_PERIOD = process.env.INACTIVITY_PERIOD || 10 * 1 * 1000; // 10 seconds by default
const inactivityTimers = {}; // Object to store timers for each channel

async function registerCommands(commandsArray, token) {
  const rest = new REST().setToken(token);

  try {
    console.log(
      `Started refreshing ${commandsArray.length} application (/) commands globally.`
    );

    const data = await rest.put(Routes.applicationCommands(config.clientId), {
      body: commandsArray,
    });

    console.log(
      `Successfully reloaded ${data.length} application (/) commands globally.`
    );
  } catch (error) {
    console.error(`Failed to reload global commands:`, error);
  }
}

function resetInactivityTimer(client, message) {
  const channelId = message.channelId;

  if (inactivityTimers[channelId]) clearTimeout(inactivityTimers[channelId]);

  inactivityTimers[channelId] = setTimeout(async () => {
    console.log(
      `No activity detected for the inactivity period in channel ${channelId}. Performing scheduled tasks...`
    );

    try {
      const replyTaskBool = await shouldReply(client, message);
      console.log("Should bot reply next?", replyTaskBool);

      if (replyTaskBool) {
        // Generate a prompt using some internal logic or context
        const { promptTemplate, messageObjects } =
          await forcedInteractionPromptFormatter(message);

        const chainResponse = await llmChatCall(
          promptTemplate,
          messageObjects,
          []
        );

        // Send the response directly to the channel
        const channel = client.channels.cache.get(channelId);
        if (channel) {
          sendInteractionMessageInParts(message, chainResponse.content);
        } else {
          console.error(`Channel with ID ${channelId} not found.`);
        }
      }
    } catch (error) {
      console.error("Error determining if bot should reply:", error);
    }

    // Optionally, remove the timer if it's no longer needed after the task is performed
    delete inactivityTimers[channelId];
  }, INACTIVITY_PERIOD);
}

function shouldIgnoreMessage(message, client) {
  return (
    (message.channel.guildId &&
      !config.channelIds.includes(message.channelId)) ||
    message.author.username === client.user.username ||
    config.ignorePatterns.some((pattern) =>
      message.cleanContent.startsWith(pattern)
    )
  );
}

async function execute(client, sharedState, channels) {
  const token = process.env.BOT_TOKEN; // Use the token from environment variables
  const commandsDir = path.resolve("./src/commands");
  let commandFiles;

  try {
    commandFiles = await fs.readdir(commandsDir);
    console.log("Command files found:", commandFiles);
  } catch (err) {
    console.error("Failed to read command files:", err);
    return;
  }

  const commandsArray = [];

  for (let file of commandFiles) {
    if (file.endsWith(".js")) {
      try {
        const commandPath = `file://${path.resolve(commandsDir, file)}`;
        const command = await import(commandPath);

        if (command && typeof command.create === "function") {
          const cmd = command.create(); // No need to call toJSON() since create() returns JSON
          commandsArray.push(cmd);
          console.log(`Command registered: ${cmd.name}`);
        } else {
          console.warn(`Command ${file} does not have a create method.`);
        }
      } catch (err) {
        console.error(`Failed to import command ${file}:`, err);
      }
    }
  }

  await registerCommands(commandsArray, token);

  createTables();
  console.log(`Successfully logged in as ${client.user.username}!`);

  // Add event listener to reset the timer on user activity in specific channels
  client.on("messageCreate", (message) => {
    if (!shouldIgnoreMessage(message, client)) {
      resetInactivityTimer(client, message);
    }
  });

  client.on("interactionCreate", (interaction) => {
    if (
      interaction.isMessageComponent() &&
      !shouldIgnoreMessage(interaction.message, client)
    ) {
      resetInactivityTimer(client, interaction.message);
    }
  });
}

export default {
  name: "ready",
  once: true,
  execute,
};
