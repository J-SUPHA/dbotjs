import config from "../config.js";

export function shouldIgnoreMessage(message, client) {
  return (
    (message.channel.guildId &&
      !config.channelIds.includes(message.channelId)) ||
    message.author.username === client.user.username ||
    config.ignorePatterns.some((pattern) =>
      message.cleanContent.startsWith(pattern)
    )
  );
}
