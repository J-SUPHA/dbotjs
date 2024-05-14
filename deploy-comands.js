import { REST, Routes } from "discord.js";
import config from "./config.json" assert { type: "json" };
import fs from "node:fs/promises";
import path from "node:path";

async function loadCommands(foldersPath) {
  const commands = [];
  const commandFoldersOrFiles = await fs.readdir(foldersPath);

  for (const entry of commandFoldersOrFiles) {
    const entryPath = path.join(foldersPath, entry);
    let commandFiles;

    const isDirectory = (await fs.stat(entryPath)).isDirectory();
    if (isDirectory) {
      commandFiles = (await fs.readdir(entryPath)).filter((file) =>
        file.endsWith(".js")
      );
      commandFiles = commandFiles.map((file) => path.join(entryPath, file));
    } else if (entry.endsWith(".js")) {
      commandFiles = [entryPath];
    } else {
      continue;
    }

    for (const filePath of commandFiles) {
      try {
        const { default: command } = await import(`file://${filePath}`);
        command.data && commands.push(command.data.toJSON());
      } catch (error) {
        console.error(`Error loading command ${filePath}:`, error);
      }
    }
  }

  return commands;
}

async function refreshCommands(commands) {
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
}

(async () => {
  const foldersPath = path.join(path.resolve(), "src/commands");
  const commands = await loadCommands(foldersPath);
  await refreshCommands(commands);
})();
