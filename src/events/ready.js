import { promises as fs } from "fs";
import { createTables } from "#memory/createdb";

async function execute(client, sharedState, channels) {
  const commandsDir = "./src/commands";
  let commandFiles;
  try {
    commandFiles = await fs.readdir(commandsDir);
  } catch (err) {
    console.error("Failed to read command files:", err);
    return;
  }

  const commandsArray = [];
  for (let file of commandFiles) {
    if (file.endsWith(".js")) {
      try {
        const command = file.slice(0, -3); // Remove the .js extension
        const commandFile = await import(`#commands/${command}`);
        commandsArray.push(commandFile.create());
      } catch (err) {
        console.error(`Failed to import command ${file}:`, err);
      }
    }
  }

  try {
    await client.application.commands.set(commandsArray);
    createTables();
    console.log(`Successfully logged in as ${client.user.username}!`);
    // how to get the bot's username
    // console.log(client.user.username);
  } catch (err) {
    console.error("Failed to set commands:", err);
  }
}

export default {
  name: "ready",
  once: true,
  execute,
};
