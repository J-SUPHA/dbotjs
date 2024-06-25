import {} from "dotenv/config";
import fs from "fs";
import { Client, GatewayIntentBits, Partials } from "discord.js";

class Bot {
  constructor() {
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

    this.sharedState = {};
    this.loadEvents();
  }

  loadEvents() {
    const eventsPath = "./src/events";
    const eventFiles = fs
      .readdirSync(eventsPath)
      .filter((file) => file.endsWith(".js"));

    eventFiles.forEach(async (file) => {
      const event = await import(`${eventsPath}/${file}`);
      const eventName = file.split(".")[0];

      const handler = (...args) => {
        if (event.default) {
          const possibleFunctionNames = ["execute", "invoke", "create"];

          const functionName = possibleFunctionNames.find(
            (name) => typeof event.default[name] === "function"
          );

          if (functionName) {
            event.default[functionName](
              ...args,
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

      if (event.default && event.default.once) {
        this.client.once(eventName, handler);
      } else if (event.default) {
        this.client.on(eventName, handler);
      }
    });
  }

  start() {
    if (!process.env.BOT_TOKEN) {
      throw new Error("BOT_TOKEN is required in the .env file.");
    }

    this.client.login(process.env.BOT_TOKEN).then(() => {
      this.sharedState.clientId = this.client.user.id;
    });
  }
}

const bot = new Bot();
bot.start();
