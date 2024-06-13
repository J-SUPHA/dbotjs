import "dotenv/config";
import { Client, GatewayIntentBits, Partials } from "discord.js";
import config from "./src/config.js";

const GUILD_ID = "832294988557713488";

class CommandUnregisterer {
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

    this.client.once("ready", this.onReady.bind(this));
    this.client.login(process.env.BOT_TOKEN);
  }

  async onReady() {
    try {
      const guild = await this.client.guilds.fetch(GUILD_ID);
      const commands = await guild.commands.fetch();

      console.log(`Fetched ${commands.size} commands for guild ${GUILD_ID}.`);

      for (const [commandId, command] of commands) {
        await guild.commands.delete(commandId);
        console.log(`Deleted command ${command.name} (${commandId})`);
      }

      console.log(`All commands for guild ${GUILD_ID} have been unregistered.`);
    } catch (error) {
      console.error(
        `Error unregistering commands for guild ${GUILD_ID}:`,
        error
      );
    } finally {
      this.client.destroy();
    }
  }
}

new CommandUnregisterer();
