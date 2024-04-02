import { readFile } from "fs/promises";

const loadAndFormatTemplate = async (filePath) => {
  const template = await readFile(filePath, "utf8");
  return (replacements) =>
    Object.entries(replacements).reduce((acc, [placeholder, value]) => {
      const regex = new RegExp(`{{${placeholder}}}`, "g");
      return acc.replace(regex, value);
    }, template);
};

export async function promptFormatter(char, user, userMessage, history) {
  const filePath = "prompt.txt";
  const templateFormatter = await loadAndFormatTemplate(filePath);
  const formattedPrompt = templateFormatter({ char, user, history });
  return `${formattedPrompt}\n${user}: ${userMessage}\n${char}: `;
}
