import { promptFormatter } from "./promptFormatter.js";
import { historyFormatter } from "../memory/historyFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";

// Revised processMessage function
export async function processMessage(message, memories, client) {
  // console.log(message);

  const chatMessages = await historyFormatter(
    message.channelId,
    client.user.username,
    10
  );

  // Determine the userName of the message sender
  const userName = message.author.globalName;
  const botName = client.user.username;

  let captionResponse = "";
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      const response = await imageCaption(attachment.url); // Removed .split()
      if (response) {
        // Ensure response is not undefined
        captionResponse += ` [${userName} posts a picture of ${response}]`;
      }
    }
  }

  const prompt = await promptFormatter(
    botName,
    userName,
    message.cleanContent + captionResponse,
    chatMessages
  );

  try {
    if (message.guildId) return; // Assuming you want to exit if this is a guild message
    // console.log("Prompt:", prompt);

    const chainResponse = await llmCall(prompt, [`\n${userName}: `]);

    // Check for a valid response
    if (chainResponse) {
      return chainResponse;
    } else {
      // Handle cases where no response is received
      console.log("No response received from chain.call");
      return "Error. Check the logs.";
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
  }
}
