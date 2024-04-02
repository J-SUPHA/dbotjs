import {} from "dotenv/config";
import fs from "fs";
import {
  Client,
  GatewayIntentBits,
  Partials,
  Collection,
  ActivityType,
} from "discord.js";
import dotenv from "dotenv";
dotenv.config();

class Bot {
  constructor() {
    // Initialize the Discord client with the specified intents
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
      ],
    });
    this.memories = {
      DM: {},
      CHANNEL: {},
    };

    this.channels = process.env.CHANNEL_IDS.split(",");
    this.sharedState = {}; // Initialize shared state object
    // Load and attach event handlers
    this.loadEvents();
  }

  loadEvents() {
    const eventsPath = "./src/events";
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));

    eventFiles.forEach(async (file) => {
      const event = await import(`${eventsPath}/${file}`);
      const eventName = file.split(".")[0]; // Assuming the file name matches the event name

      const handler = (...args) => {
        if (event.default) {
          // Define the possible function names according to your convention
          const possibleFunctionNames = ["execute", "invoke", "create"];

          // Find the first function name that matches an exported function
          const functionName = possibleFunctionNames.find(
            (name) => typeof event.default[name] === "function"
          );

          if (functionName) {
            // Dynamically call the function if it exists
            event.default[functionName](
              ...args,
              this.memories,
              this.client,
              this.sharedState,
              this.channels
            );
          } else {
            console.error(
              `The event file ${file} does not properly export a handler function.`
            );
          }
        }
      };

      // Register the event listener based on the 'once' property
      if (event.default && event.default.once) {
        this.client.once(eventName, handler);
      } else if (event.default) {
        this.client.on(eventName, handler);
      }
    });
  }

  start() {
    // Login to Discord with the app's token
    this.client.login(process.env.BOT_TOKEN);
  }
}

// Create a new instance of the Bot class and start it
const bot = new Bot();
bot.start();
