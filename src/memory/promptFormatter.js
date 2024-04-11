import { readFile } from "fs/promises";
import { historyFormatter } from "../memory/historyFormatter.js";

const loadAndFormatTemplate = async (filePath) => {
  const template = await readFile(filePath, "utf8");
  return (replacements) =>
    Object.entries(replacements).reduce((acc, [placeholder, value]) => {
      const regex = new RegExp(`{{${placeholder}}}`, "g");
      return acc.replace(regex, value);
    }, template);
};

export async function promptFormatter(message, client, formattedMesssage) {
  const messageHistory = await historyFormatter(message, client);
  const filePath = "prompt.txt";
  const userName = message.author.globalName;
  const botName = client.user.username;
  const templateFormatter = await loadAndFormatTemplate(filePath);
  const formattedPrompt = templateFormatter({
    botName,
    userName,
    messageHistory,
  });
  const formattedUserMessage = `<|START_OF_TURN_TOKEN|><|USER_TOKEN|> ${userName}: ${userMessage}<|END_OF_TURN_TOKEN|>`;
  const formattedBotMessage = `<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|> ${botName}:`;
  return `${formattedPrompt} ${formattedUserMessage}\n${formattedBotMessage}`;
}
