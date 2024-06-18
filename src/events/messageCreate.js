import { processMessage } from "../memory/responseHandler.js";
import config from "../config.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (shouldIgnoreMessage(message, client)) {
      return;
    }

    try {
      await processMessage(message, client);
    } catch (error) {
      console.error("Error processing message in messageCreate event:", error);
    }
  },
};

function shouldIgnoreMessage(message, client) {
  return (
    (message.channel.guildId &&
      !config.channelIds.includes(message.channelId)) ||
    message.author.username === client.user.username ||
    config.ignorePatterns.some((pattern) =>
      message.cleanContent.startsWith(pattern)
    )
  );
}
