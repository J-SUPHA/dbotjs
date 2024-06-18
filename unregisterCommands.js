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

      // Unregistering guild-specific commands
      const guildCommands = await guild.commands.fetch();
      console.log(
        `Fetched ${guildCommands.size} guild-specific commands for guild ${GUILD_ID}.`
      );
      for (const [commandId, command] of guildCommands) {
        await guild.commands.delete(commandId);
        console.log(
          `Deleted guild-specific command ${command.name} (${commandId})`
        );
      }

      // Unregistering global commands
      const globalCommands = await this.client.application.commands.fetch();
      console.log(`Fetched ${globalCommands.size} global commands.`);
      for (const [commandId, command] of globalCommands) {
        await this.client.application.commands.delete(commandId);
        console.log(`Deleted global command ${command.name} (${commandId})`);
      }

      console.log(`All commands have been unregistered.`);
    } catch (error) {
      console.error(`Error unregistering commands:`, error);
    } finally {
      this.client.destroy();
    }
  }
}

new CommandUnregisterer();
