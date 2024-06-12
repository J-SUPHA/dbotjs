import { promptFormatter } from "./promptFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/message-type.js";

// Function to handle attachments and generate captions
async function handleAttachments(message, userName) {
  let captionResponse = "";
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      try {
        const response = await imageCaption(attachment.url);
        console.log("Image URL: ", response);
        console.log("Image caption response: ", response);
        if (response) {
          captionResponse += ` [${userName} posts a picture. You can see: ${response}]`;
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
  try {
    if (message.reference) {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
      if (referencedMessage.author.id !== client.user.id) {
        await logDetailedMessage(
          message,
          client,
          message.cleanContent + captionResponse
        );
        console.log("Logging channel message with reference");
        return true;
      }
    }

    console.log("Logging channel message. No reference");
    await logDetailedMessage(
      message,
      client,
      message.cleanContent + captionResponse
    );
    return true;
  } catch (error) {
    console.error("Failed to fetch referenced message:", error);
    return false;
  }
}

async function handleChannelReply(message, client, captionResponse) {
  try {
    if (message.mentions.repliedUser !== null) {
      if (message.mentions.repliedUser.id !== client.user.id) {
        console.log("the bot is not mentioned in the reply");
        return true;
      }
    }
  } catch (error) {
    return false;
  }
}

// Main function to process messages
async function processMessage(message, client) {
  const userName = message.author.globalName;
  const botName = client.user.username;

  try {
    const captionResponse = await handleAttachments(message, userName);

    const isChannelMessage = (await getMessageType(message)) === "channel";
    // isOtherBotReply should be true if message.mentions.repliedUser.id !== client.user.id and false otherwise

    const shouldHandleChannelMessage =
      isChannelMessage && !message.mentions.has(client.user.id);
    console.log("shouldHandleChannelMessage: ", shouldHandleChannelMessage);

    if (shouldHandleChannelMessage) {
      console.log("shouldHandleChannelMessage is true");
      const shouldReturn = await handleChannelMessage(
        message,
        client,
        captionResponse
      );
      const replyReturn = await handleChannelReply(
        message,
        client,
        captionResponse
      );

      if (shouldReturn || replyReturn) return;
    } else {
      // Log the user's message before generating the response
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
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

    // Check for a valid response
    if (chainResponse) {
      // console.log("Logging response generated");
      return chainResponse;
    } else {
      // Handle cases where no response is received
      console.log(
        "No response received from llm. Pass in a correct API key if you are using OpenAI or else specify the llmBaseUrl in the config if you are using an OpenAI compatible API."
      );
      console.log("Logging no response scenario");
      return null; // Return null instead of "Error. Check the logs."
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
    console.log("Logging error scenario");
    return null; // Return null instead of "Error. Check the logs."
  }
}

export { processMessage };
