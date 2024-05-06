export function contentCleaner(message, botName) {
  if (message.startsWith(`@${botName}`)) {
    return message.replace(new RegExp(`@${botName}`, "gi"), "").trim();
  } else {
    return message.replace("@", "").trim();
  }
}
