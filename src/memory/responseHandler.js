import { promptFormatter } from "./promptFormatter.js";
import { historyFormatter } from "../memory/historyFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";

function getMessageType(message) {
  if (message.channel.guildId) {
    return "channel";
  } else {
    return "dm";
  }
}

// Revised processMessage function
export async function processMessage(message, client) {
  const channelType = getMessageType(message);

  const chatMessages = await historyFormatter(
    message.channelId,
    client.user.username,
    channelType
  );
  // console.log(chatMessages);

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
    const chainResponse = await llmCall(prompt, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    // Check for a valid response
    if (chainResponse) {
      return chainResponse;
    } else {
      // Handle cases where no response is received
      console.log(
        "No response received from llm. Pass in a correct API key if you are using OpenAI or else specify the llmBaseUrl in the config if you are using an OpenAI compatible API."
      );
      return "Error. Check the logs.";
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
  }
}
