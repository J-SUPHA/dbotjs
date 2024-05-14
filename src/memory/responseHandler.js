import { promptFormatter } from "./promptFormatter.js";
import llmCall from "../chatlogic/llmCall.js";
import imageCaption from "../tools/imageCaption.js";
import { logDetailedMessage } from "../memory/chatLog.js";
import getMessageType from "../utils/message-type.js";
import { handleMessage } from "./messageTracker.js";

export async function processMessage(message, client) {
  const userName = message.author.globalName;
  const botName = client.user.username;
  const captionResponse = await handleAttachments(message, userName);

  const messageType = await getMessageType(message);
  if (messageType === "channel" && shouldLogMessage(message, client)) {
    await logDetailedMessage(
      message,
      client,
      message.cleanContent + captionResponse
    );
    handleMessage(message, client);
    return;
  }

  const prompt = await promptFormatter(
    message,
    client,
    message.cleanContent + captionResponse
  );
  return await handleResponse(
    message,
    prompt,
    userName,
    botName,
    client,
    captionResponse
  );
}

async function handleAttachments(message, userName) {
  let captions = "";
  if (message.attachments.size > 0) {
    for (const attachment of message.attachments.values()) {
      const response = await imageCaption(attachment.url);
      if (response) {
        captions += ` [${userName} posts a picture. Observation: ${response}]`;
      }
    }
  }
  return captions;
}

function shouldLogMessage(message, client) {
  return (
    (!message.mentions.has(client.user.id) && !message.reference) ||
    (message.reference &&
      message.reference.author &&
      message.reference.author.id !== client.user.id)
  );
}

async function handleResponse(
  message,
  prompt,
  userName,
  botName,
  client,
  captionResponse
) {
  try {
    await message.channel.sendTyping();
    const response = await llmCall(prompt, [
      `\n${userName}: `,
      `\n${botName}: `,
    ]);
    if (response) {
      await logDetailedMessage(
        message,
        client,
        message.cleanContent + captionResponse
      );
      handleMessage(message, client);
      return response;
    } else {
      console.log(
        "No response received from llm. Please check the API key or llmBaseUrl."
      );
      return "Error. Check the logs.";
    }
  } catch (error) {
    console.error("An error occurred while processing the message:", error);
    return "Error occurred. Please check logs.";
  }
}
