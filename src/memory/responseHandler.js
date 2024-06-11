import { promptFormatter } from "./promptFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/message-type.js";

async function handleAttachments(message, userName) {
  let captionResponse = "";
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      try {
        const response = await imageCaption(attachment.url);
        console.log("Image caption response: ", response);
        if (response) {
          captionResponse += ` [${userName} posts a picture. Observation: ${response}]`;
          console.log("Caption response: ", captionResponse);
        }
      } catch (error) {
        console.error("Error processing attachment:", error);
      }
    }
  }
  return captionResponse;
}

async function handleChannelMessage(message, client, captionResponse) {
  if (!message.mentions.has(client.user.id) && message.reference === null) {
    await logDetailedMessage(
      message,
      client,
      message.cleanContent + captionResponse
    );
    return true;
  }

  if (message.reference) {
    try {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );

      if (referencedMessage.author.id !== client.user.id) {
        await logDetailedMessage(
          message,
          client,
          message.cleanContent + captionResponse
        );
        return true;
      }
    } catch (error) {
      console.error("Failed to fetch referenced message:", error);
    }
  }
  return false;
}

async function processMessage(message, client) {
  const userName = message.author.globalName;
  const botName = client.user.username;

  try {
    const captionResponse = await handleAttachments(message, userName);

    if ((await getMessageType(message)) === "channel") {
      const shouldReturn = await handleChannelMessage(
        message,
        client,
        captionResponse
      );
      if (shouldReturn) return;
    }

    const prompt = await promptFormatter(
      message,
      client,
      message.cleanContent + captionResponse
    );

    await message.channel.sendTyping();

    const chainResponse = await llmCall(prompt, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    if (chainResponse) {
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
      return chainResponse;
    } else {
      console.log(
        "No response received from llm. Ensure API key or LLM base URL is correct."
      );
      return "Error. Check the logs.";
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
    return "An unexpected error occurred. Please try again later.";
  }
}

export { processMessage };
