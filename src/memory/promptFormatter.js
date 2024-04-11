import { readFile } from "fs/promises";
import { historyFormatter } from "../memory/historyFormatter.js";
import getCurrentDateFormatted from "../helpers/dateFormatter.js";

const loadAndFormatTemplate = async (filePath) => {
  try {
    const template = await readFile(filePath, "utf8");
    return (replacements) =>
      Object.entries(replacements).reduce((acc, [placeholder, value]) => {
        const regex = new RegExp(`{{${placeholder}}}`, "g");
        return acc.replace(regex, value);
      }, template);
  } catch (error) {
    console.error("Error loading and formatting template:", error);
    throw error;
  }
};

export async function promptFormatter(message, client, formattedMessage) {
  try {
    const history = await historyFormatter(message, client);
    const date = getCurrentDateFormatted();
    const filePath = "prompt.txt";
    const user = message.author.globalName;
    const char = client.user.username;
    const templateFormatter = await loadAndFormatTemplate(filePath);

    const formattedPrompt = templateFormatter({
      char,
      user,
      history,
      date,
    });
    const formattedUserMessage = `<|START_OF_TURN_TOKEN|><|USER_TOKEN|> ${user}: ${formattedMessage}<|END_OF_TURN_TOKEN|>`;
    const formattedBotMessage = `<|START_OF_TURN_TOKEN|><|CHATBOT_TOKEN|> ${char}:`;
    return `${formattedPrompt} ${formattedUserMessage}\n${formattedBotMessage}`;
  } catch (error) {
    console.error("Error formatting prompt:", error);
    throw error;
  }
}
