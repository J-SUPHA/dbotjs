import { promises as fs } from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { createTables } from "#memory/createdb";
import {} from "dotenv/config";

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
}

export default {
  name: "ready",
  once: true,
  execute,
};
