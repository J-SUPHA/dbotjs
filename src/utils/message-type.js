export default function getMessageType(message) {
  if (message.guildId) {
    return "channel";
  } else {
    return "dm";
  }
}
