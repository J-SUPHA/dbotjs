export default function getMessageType(message) {
  if (message.channel.guildId) {
    return "channel";
  } else {
    return "dm";
  }
}
