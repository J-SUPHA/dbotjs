export default function removeBotName(name, message) {
  const botName = [name];
  const botNameRegex = new RegExp(`^(${botName.join("|")}): `);
  return message.replace(botNameRegex, "");
}
