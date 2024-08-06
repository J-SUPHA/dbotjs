import { promptFormatter } from "./promptFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/message-type.js";
import { prepareMessageParts } from "../helpers/splitMessages.js";

// Function to handle attachments and generate captions
async function handleAttachments(message, userName) {
  let captionResponse = "";
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      try {
        const response = await imageCaption(attachment.url);
        if (response) {
          captionResponse += ` [${userName} posts a picture. You can see: ${response}]`;
        }
      } catch (error) {
        console.error("Error processing attachment:", error);
      }
    }
  }
  return captionResponse;
}

// Logic for handling channel messages
// Logs the message if it has a reference and the reference is not from the bot
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
        return true;
      }
    }
    // Log the message if there is no reference
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

// Function to handle channel replies
// Returns true if the reply is to another user, not the bot
async function handleChannelReply(message, client, captionResponse) {
  try {
    if (message.mentions.repliedUser !== null) {
      if (message.mentions.repliedUser.id !== client.user.id) {
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
    // Handle any attachments and generate captions for them
    const captionResponse = await handleAttachments(message, userName);

    // Determine if the message is a channel message and the bot is not mentioned
    const isChannelMessage = (await getMessageType(message)) === "channel";
    const shouldHandleChannelMessage =
      isChannelMessage && !message.mentions.has(client.user.id);

    if (shouldHandleChannelMessage) {
      // Log the message if it is a channel message and not a mention
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
      // Return if the message has been handled
      if (shouldReturn || replyReturn) return;
    } else {
      // Log the user's message before generating the response
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
    }

    // Format the prompt for the language model call
    const prompt = await promptFormatter(
      message,
      client,
      message.cleanContent + captionResponse
    );
    // console.log("Prompt: ", prompt);

    let typing = true;

    // Function to keep sending typing indicator
    const keepTyping = async () => {
      while (typing) {
        await message.channel.sendTyping();
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Discord typing status lasts for 10 seconds, refresh every 5 seconds
      }
    };

    // Start showing typing indicator
    keepTyping();

    // Call the language model to generate a response
    const chainResponse = await llmCall(prompt, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    // Stop showing typing indicator
    typing = false;

    // Check for a valid response
    if (chainResponse) {
      // Prepare and send the message parts
      const messageParts = await prepareMessageParts(
        chainResponse,
        message.guild,
        botName
      );
      for (const part of messageParts) {
        const sentMessage = await message.channel.send(part);
        await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
      }
    } else {
      console.log(
        "No response received from llm. Ensure API key or llmBaseUrl is correctly set."
      );
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
  }
}

export { processMessage };
