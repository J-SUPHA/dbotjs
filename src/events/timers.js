import { shouldReply } from "../helpers/shouldReply.js";
import { forcedInteractionPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "../chatlogic/llmCall.js";
import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

const inactivityTimers = {}; // Object to store timers for each channel

async function isLastMessageFromBot(channel) {
  try {
    const messages = await channel.messages.fetch({ limit: 1 });
    const lastMessage = messages.first();
    return lastMessage ? lastMessage.author.bot : false;
  } catch (error) {
    console.error("Error fetching last message:", error);
    return false; // Assume it's not from a bot if there's an error
  }
}

export async function handleReplyTask(client, channelId, message) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }

    const lastMessageFromBot = await isLastMessageFromBot(channel);
    if (lastMessageFromBot) {
      console.log("Last message was from a bot. Skipping response.");
      return;
    }

    const replyTaskBool = await shouldReply(client, message);
    console.log("Should bot reply next?", replyTaskBool);

    if (replyTaskBool) {
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
      const { promptTemplate, messageObjects } =
        await forcedInteractionPromptFormatter(message);

      const chainResponse = await llmChatCall(
        promptTemplate,
        messageObjects,
        []
      );

      const lastMessageFromBot = await isLastMessageFromBot(channel);
      if (!lastMessageFromBot) {
        await sendInteractionMessageInParts(message, chainResponse.content);
      } else {
        console.log("Last message was from a bot. Skipping response.");
      }
      typing = false;
    }
  } catch (error) {
    console.error("Error in reply task:", error);
  } finally {
    delete inactivityTimers[channelId];
    console.log(`Timer removed for channel ${channelId}`);
  }
}

export async function handleSummarizationTask(client, channelId, message) {
  // Placeholder function for a summarization task
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel) {
      console.error(`Channel with ID ${channelId} not found.`);
      return;
    }

    // Add summarization logic here
    console.log(`Summarization task executed for channel ${channelId}`);
  } catch (error) {
    console.error("Error in summarization task:", error);
  } finally {
    delete inactivityTimers[channelId];
    console.log(`Timer removed for channel ${channelId}`);
  }
}

export async function resetInactivityTimer(
  client,
  message,
  taskFunction,
  periodKey = "default"
) {
  const INACTIVITY_PERIODS = {
    default: process.env.INACTIVITY_PERIOD || 10 * 1000, // 10 seconds by default
    short: 5 * 1000, // 5 seconds
    medium: 30 * 1000, // 30 seconds
    long: 60 * 1000, // 1 minute
  };

  const channelId = message.channelId;

  if (inactivityTimers[channelId]) {
    clearTimeout(inactivityTimers[channelId]);
    console.log(`Cleared timer for channel ${channelId}`);
  }

  const INACTIVITY_PERIOD =
    INACTIVITY_PERIODS[periodKey] || INACTIVITY_PERIODS.default;

  inactivityTimers[channelId] = setTimeout(async () => {
    console.log(
      `No activity detected for the inactivity period in channel ${channelId}. Performing scheduled tasks...`
    );

    await taskFunction(client, channelId, message);
  }, INACTIVITY_PERIOD);

  console.log(`Set timer for channel ${channelId} with period ${periodKey}`);
}
