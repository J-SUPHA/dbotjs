import { systemPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "./llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../helpers/message-type.js";
import { prepareMessageParts } from "../helpers/splitMessages.js";

async function logMessage(message, client, captionResponse) {
  const userName = message.member?.displayName ?? message.author.globalName;
  console.log(`${userName}: ${message.cleanContent}${captionResponse}`);
  await logDetailedMessage(
    message,
    client,
    message.cleanContent + captionResponse
  );
}

async function sendMessageParts(content, message, client, botName) {
  const messageParts = await prepareMessageParts(
    content,
    message.guild,
    botName
  );
  for (const part of messageParts) {
    const sentMessage = await message.channel.send(part);
    await logDetailedMessage(sentMessage, client, sentMessage.cleanContent);
  }
}

async function handleAttachments(message) {
  if (message.attachments.size === 0) return "";

  const captions = await Promise.all(
    [...message.attachments.values()].map(async (attachment) => {
      try {
        const response = await imageCaption(attachment.url);
        return response ? `<image>${response}</image>` : "";
      } catch (error) {
        console.error("Error processing attachment:", error);
        return "";
      }
    })
  );

  return captions.join("");
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

function startTyping(channel) {
  let isTyping = true;
  const typingInterval = setInterval(() => {
    if (isTyping) channel.sendTyping();
  }, 5000);

  return {
    stop: () => {
      isTyping = false;
      clearInterval(typingInterval);
    },
  };
}

async function processMessage(message, client) {
  try {
    const userName = message.member?.displayName ?? message.author.globalName;
    const botName = client.user.username;

    const captionResponse = await handleAttachments(message);
    const messageType = await getMessageType(message);
    const isChannelMessage =
      messageType === "channel" && !message.mentions.has(client.user.id);

    if (isChannelMessage) {
      const shouldReturn =
        (await handleChannelMessage(message, client, captionResponse)) ||
        (await handleChannelReply(message, client, captionResponse));
      if (shouldReturn) return;
    } else {
      await logMessage(message, client, captionResponse);
    }

    const { promptTemplate, messageObjects } = await systemPromptFormatter(
      message,
      client
    );

    const typing = startTyping(message.channel);

    const chainResponse = await llmChatCall(promptTemplate, messageObjects, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);

    typing.stop();

    console.log(`${botName}: ${chainResponse.content}`);

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

export { processMessage };
