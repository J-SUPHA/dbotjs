import { promises as fs } from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { createTables } from "#memory/createdb";
import {} from "dotenv/config";
import { resetInactivityTimer } from "./timers.js";
import config from "../config.js";

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

async function registerCommands(commandsArray, token, sharedState) {
  const rest = new REST().setToken(token);

  try {
    console.log(
      `Started refreshing ${commandsArray.length} application (/) commands globally.`
    );

    const data = await rest.put(
      Routes.applicationCommands(sharedState.application.id),
      {
        body: commandsArray,
      }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands globally.`
    );
  } catch (error) {
    console.error(`Failed to reload global commands:`, error);
  }
}

async function execute(client, sharedState, channels) {
  console.log("sharedState in ready event:", sharedState.application.id);
  const token = process.env.BOT_TOKEN;
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
          const cmd = command.create();
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

  await registerCommands(commandsArray, token, sharedState);

  createTables();
  console.log(`Successfully logged in as ${client.user.username}!`);

  let lastMessageAuthor = null;

  client.on("messageCreate", async (message) => {
    try {
      if (!shouldIgnoreMessage(message, client)) {
        // Check if the last message was not from the bot
        if (lastMessageAuthor !== client.user.id) {
          await resetInactivityTimer(client, message);
        }
        // Update the last message author
        lastMessageAuthor = message.author.id;
      }
    } catch (error) {
      console.error("Error processing message:", error);
    }
  });

  client.on("interactionCreate", async (interaction) => {
    try {
      if (
        interaction.isMessageComponent() &&
        !shouldIgnoreMessage(interaction.message, client)
      ) {
        // For interactions, we always reset the timer as they are user-initiated
        await resetInactivityTimer(client, interaction.message);
        // Update the last message author to the user who interacted
        lastMessageAuthor = interaction.user.id;
      }
    } catch (error) {
      console.error("Error processing interaction:", error);
    }
  });
}

export default {
  name: "ready",
  once: true,
  execute,
};
