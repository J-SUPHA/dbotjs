import { systemPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "./llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/message-type.js";
import { prepareMessageParts } from "../helpers/splitMessages.js";
import { resetInactivityTimer, handleReplyTask } from "../events/timers.js";

// Function to log a message with its caption response
async function logMessage(message, client, captionResponse) {
  // Extract the username from the message object
  const userName = message.member?.displayName ?? message.author.globalName;
  console.log(`${userName}: ${message.cleanContent}${captionResponse}`);
  // Log the message details into the chat log
  await logDetailedMessage(
    message,
    client,
    message.cleanContent,
    captionResponse
  );
}

// Function to send message parts, splitting long messages if necessary
async function sendMessageParts(content, message, client, botName) {
  // Prepare message parts for sending
  const messageParts = await prepareMessageParts(
    content,
    message.guild,
    botName
  );
  // Iterate through each part and send it to the channel
  for (const part of messageParts) {
    const sentMessage = await message.channel.send(part);
    // Log each part of the sent message
    await logDetailedMessage(sentMessage, client, sentMessage.cleanContent, "");
  }
}

// Function to handle attachments in a message
async function handleAttachments(message) {
  console.log("message.attachments: ", message.attachments);
  // Return an empty string if there are no attachments
  if (message.attachments.size === 0) return "";

  // Process each attachment to generate captions
  const captions = await Promise.all(
    [...message.attachments.values()].map(async (attachment) => {
      try {
        const response = await imageCaption(attachment.url);
        return response ? response : "";
      } catch (error) {
        console.error("Error processing attachment:", error);
        return "";
      }
    })
  );

  // Join all captions into a single string
  return captions.join("");
}

// Function to handle messages sent in channels
async function handleChannelMessage(message, client, captionResponse) {
  try {
    // Check if the message is a reply to another message
    if (message.reference) {
      const referencedMessage = await message.channel.messages.fetch(
        message.reference.messageId
      );
      // If the referenced message is not from the bot, log the current message and return true
      if (referencedMessage.author.id !== client.user.id) {
        await logDetailedMessage(
          message,
          client,
          message.cleanContent,
          captionResponse
        );
        return true;
      }
    }

    // Log the message details
    await logDetailedMessage(
      message,
      client,
      message.cleanContent,
      captionResponse
    );
    return true;
  } catch (error) {
    console.error("Failed to fetch referenced message:", error);
    return false;
  }
}

// Function to handle replies to the bot's messages
function handleChannelReply(message, client) {
  try {
    // Check if the message is a reply to another user
    if (message.mentions.repliedUser !== null) {
      // If the replied user is not the bot, return true
      if (message.mentions.repliedUser.id !== client.user.id) {
        return true;
      }
    }
  } catch (error) {
    console.error("Failed to fetch replied user:", error);
    return false;
  }
}

// Function to simulate typing in a channel
function startTyping(channel) {
  let isTyping = true;
  // Set an interval to send typing notifications every 5 seconds
  const typingInterval = setInterval(() => {
    if (isTyping) channel.sendTyping();
  }, 5000);

  return {
    // Function to stop typing notifications
    stop: () => {
      isTyping = false;
      clearInterval(typingInterval);
    },
  };
}

// Main function to process incoming messages
async function processMessage(message, client) {
  console.log("message: ", message.cleanContent);
  try {
    // Extract usernames from the message and client objects
    const userName = message.member?.displayName ?? message.author.globalName;
    const botName = client.user.username;

    // Handle attachments in the message
    const captionResponse = await handleAttachments(message);
    // Determine the type of message (e.g., channel or direct message)
    const messageType = await getMessageType(message);
    const isChannelMessage =
      messageType === "channel" && !message.mentions.has(client.user.id);

    // Handle channel messages and replies
    if (isChannelMessage) {
      const shouldReturn =
        (await handleChannelMessage(message, client, captionResponse)) ||
        handleChannelReply(message, client);
      if (shouldReturn) {
        await resetInactivityTimer(client, message, handleReplyTask, "default");
        return;
      }
    } else {
      // Log the message if it's not a channel message
      await logMessage(message, client, captionResponse);
    }

    // Format the prompt for the language model
    const { promptTemplate, messageObjects } = await systemPromptFormatter(
      message,
      client
    );

    // Start typing simulation in the channel
    const typing = startTyping(message.channel);

    // Call the language model with the formatted prompt
    const chainResponse = await llmChatCall(promptTemplate, messageObjects, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    // Stop typing simulation
    typing.stop();

    console.log(`${botName}: ${chainResponse.content}`);

    // Send the response from the language model in parts if necessary
    if (chainResponse) {
      await sendMessageParts(chainResponse.content, message, client, botName);
    } else {
      console.log(
        "No response received from llm. Ensure API key or llmBaseUrl is correctly set."
      );
    }
  } catch (error) {
    console.error("An error occurred in processMessage:", error);
  }
}

// Export the processMessage function for use in other modules
export { processMessage };
