import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };
import fs from "node:fs";
import path from "node:path";

const commands = [];
const foldersPath = path.join(path.resolve(), "src/events/commands");
const commandFoldersOrFiles = fs.readdirSync(foldersPath);

// Use an async IIFE to allow for await inside the loop
(async () => {
  for (const entry of commandFoldersOrFiles) {
    const entryPath = path.join(foldersPath, entry);
    let commandFiles;

    // Check if the entry is a directory or a file
    if (fs.statSync(entryPath).isDirectory()) {
      // It's a directory, read its contents
      commandFiles = fs
        .readdirSync(entryPath)
        .filter((file) => file.endsWith(".js"));
      commandFiles = commandFiles.map((file) => path.join(entryPath, file)); // Convert to full paths
    } else if (entry.endsWith(".js")) {
      // It's a file, use it directly
      commandFiles = [entryPath];
    } else {
      // Not a JS file, skip it
      continue;
    }

    for (const filePath of commandFiles) {
      try {
        const { default: command } = await import(`file://${filePath}`);
        if (command.data) {
          commands.push(command.data.toJSON());
        } else {
          console.log(
            `[WARNING] The command in ${filePath} is missing a "data" property.`
          );
        }
      } catch (error) {
        console.error(`Error loading command ${filePath}:`, error);
      }
    }
  }

  const rest = new REST({ version: "10" }).setToken(config.token);

  try {
    console.log(
      `Started refreshing ${commands.length} application (/) commands.`
    );

    const data = await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.guild),
      { body: commands }
    );

    console.log(
      `Successfully reloaded ${data.length} application (/) commands.`
    );
  } catch (error) {
    console.error(error);
  }
})();
