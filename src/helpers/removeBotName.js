export default function removeBotName(botName, message) {
  if (!botName || !message) {
    throw new Error("Both botName and message must be provided");
  }

  const botNameRegex = new RegExp(`(?:${botName}:\\s*)+`, "g");
  return message.replace(botNameRegex, "");
}
