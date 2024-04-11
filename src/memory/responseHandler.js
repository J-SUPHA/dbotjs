import { promptFormatter } from "./promptFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/messageType.js";

export async function processMessage(message, client) {
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

  // If the message type is a dm then it will always reply and carry out the next part.
  // If the message type is a channel then it will only reply if the bot was @mentioned or replied to

  if ((await getMessageType(message)) === "channel") {
    if (!message.mentions.has(client.user.id) && message.reference === null) {
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
      return;
    }
  }

  const prompt = await promptFormatter(
    message,
    client,
    message.cleanContent + captionResponse
  );

  try {
    const chainResponse = await llmCall(prompt, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    // Check for a valid response
    if (chainResponse) {
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
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
