import { promises as fs } from "fs";
import path from "path";
import { createTables } from "#memory/createdb";
import config from "../config.js";

async function getGuildIdsFromChannelIds(client, channelIds) {
  const guildIds = new Set();

  for (const channelId of channelIds) {
    try {
      const channel = await client.channels.fetch(channelId);
      if (channel && channel.guild) {
        guildIds.add(channel.guild.id);
      } else {
        console.warn(`Channel ${channelId} does not belong to a guild.`);
      }
    } catch (err) {
      console.error(`Failed to fetch channel ${channelId}:`, err);
    }
  }

  return [...guildIds];
}

function commandsAreEqual(existingCommands, newCommands) {
  if (existingCommands.size !== newCommands.length) return false;

  for (const [id, existingCommand] of existingCommands) {
    const newCommand = newCommands.find(
      (cmd) => cmd.name === existingCommand.name
    );
    if (
      !newCommand ||
      JSON.stringify(existingCommand.options) !==
        JSON.stringify(newCommand.options)
    ) {
      return false;
    }
  }

  return true;
}

async function execute(client, sharedState, channels) {
  const commandsDir = path.resolve("./src/commands"); // Absolute path to the commands directory
  let commandFiles;

  // Read the directory containing command files
  try {
    commandFiles = await fs.readdir(commandsDir);
    // console.log("Command files found:", commandFiles); // Log found command files
  } catch (err) {
    console.error("Failed to read command files:", err);
    return;
  }

  const commandsArray = [];

  // Loop through each file in the commands directory
  for (let file of commandFiles) {
    if (file.endsWith(".js")) {
      try {
        const commandPath = `file://${path.resolve(commandsDir, file)}`;
        const command = await import(commandPath);

        // Ensure the command has a create method before pushing
        if (command && typeof command.create === "function") {
          const cmd = command.create();
          commandsArray.push(cmd);
          // console.log(`Command registered: ${cmd.name}`); // Log registered command
        } else {
          console.warn(`Command ${file} does not have a create method.`);
        }
      } catch (err) {
        console.error(`Failed to import command ${file}:`, err);
      }
    }
  }

  const channelIds = config.channelIds; // Get channel IDs from your configuration
  const guildIds = await getGuildIdsFromChannelIds(client, channelIds);

  for (const guildId of guildIds) {
    const guild = client.guilds.cache.get(guildId);
    if (guild) {
      const existingCommands = await guild.commands.fetch();

      if (commandsAreEqual(existingCommands, commandsArray)) {
        console.log(`Commands for guild ${guildId} are already up to date.`);
      } else {
        await guild.commands.set(commandsArray);
        console.log(`Updated commands for guild ${guildId}.`);
      }
    } else {
      console.error(`Guild ${guildId} not found`);
    }
  }

  createTables();
  console.log(`Successfully logged in as ${client.user.username}!`);
}

export default {
  name: "ready",
  once: true,
  execute,
};
