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
      console.log("Image caption response: ", response);
      if (response) {
        // Ensure response is not undefined
        captionResponse += ` [${userName} posts a picture. Observation: ${response}]`;
        console.log("Caption response: ", captionResponse);
      }
    }
  }

  // If the message type is a dm then it will always reply and carry out the next part.
  // If the message type is a channel then it will only reply if the bot was @mentioned or replied to

  if ((await getMessageType(message)) === "channel") {
    // Check if the bot is not mentioned and there is no message reference
    if (!message.mentions.has(client.user.id) && message.reference === null) {
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
      return;
    }

    // Check if there is a message reference and then fetch the referenced message
    if (message.reference) {
      try {
        const referencedMessage = await message.channel.messages.fetch(
          message.reference.messageId
        );

        // Check if the author of the referenced message is not the bot itself
        if (referencedMessage.author.id !== client.user.id) {
          await logDetailedMessage(
            message,
            client,
            message.cleanContent + captionResponse
          );
          return;
        }
      } catch (error) {
        console.error("Failed to fetch referenced message:", error);
        // Handle errors (e.g., referenced message does not exist or access is denied)
      }
    }
  }

  const prompt = await promptFormatter(
    message,
    client,
    message.cleanContent + captionResponse
  );

  try {
    await message.channel.sendTyping();
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
