// import { promises as fs } from "fs";
// import path from "path";
// import { REST, Routes } from "discord.js";
// import { createTables } from "#memory/createdb";
// import config from "../config.js";
// import {} from "dotenv/config"; // Import dotenv to use environment variables

// async function registerCommands(commandsArray, token) {
//   const rest = new REST().setToken(token);

//   try {
//     console.log(
//       `Started refreshing ${commandsArray.length} application (/) commands globally.`
//     );

//     const data = await rest.put(Routes.applicationCommands(config.clientId), {
//       body: commandsArray,
//     });

//     console.log(
//       `Successfully reloaded ${data.length} application (/) commands globally.`
//     );
//   } catch (error) {
//     console.error(`Failed to reload global commands:`, error);
//   }
// }

// async function execute(client, sharedState, channels) {
//   const token = process.env.BOT_TOKEN; // Use the token from environment variables
//   const commandsDir = path.resolve("./src/commands");
//   let commandFiles;

//   try {
//     commandFiles = await fs.readdir(commandsDir);
//     console.log("Command files found:", commandFiles);
//   } catch (err) {
//     console.error("Failed to read command files:", err);
//     return;
//   }

//   const commandsArray = [];

//   for (let file of commandFiles) {
//     if (file.endsWith(".js")) {
//       try {
//         const commandPath = `file://${path.resolve(commandsDir, file)}`;
//         const command = await import(commandPath);

//         if (command && typeof command.create === "function") {
//           const cmd = command.create(); // No need to call toJSON() since create() returns JSON
//           commandsArray.push(cmd);
//           console.log(`Command registered: ${cmd.name}`);
//         } else {
//           console.warn(`Command ${file} does not have a create method.`);
//         }
//       } catch (err) {
//         console.error(`Failed to import command ${file}:`, err);
//       }
//     }
//   }

//   await registerCommands(commandsArray, token);

//   createTables();
//   console.log(`Successfully logged in as ${client.user.username}!`);
// }

// export default {
//   name: "ready",
//   once: true,
//   execute,
// };
import { promises as fs } from "fs";
import path from "path";
import { REST, Routes } from "discord.js";
import { createTables } from "#memory/createdb";
import config from "../config.js";
import {} from "dotenv/config"; // Import dotenv to use environment variables

let inactivityTimer;

const INACTIVITY_PERIOD = 1 * 5 * 1000; // 10 5 seconds

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

export function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);

  inactivityTimer = setTimeout(() => {
    console.log(
      "No activity detected for the inactivity period. Performing scheduled tasks..."
    );
    // Add your code here to perform tasks after inactivity period
  }, INACTIVITY_PERIOD);
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

  // Reset inactivity timer on startup
  resetInactivityTimer();
}

export default {
  name: "ready",
  once: true,
  execute,
};
