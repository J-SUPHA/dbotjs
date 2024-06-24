import { shouldReply } from "../helpers/shouldReply.js";
import { forcedInteractionPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "../chatlogic/llmCall.js";
import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

const INACTIVITY_PERIOD = process.env.INACTIVITY_PERIOD || 10 * 1 * 1000; // 10 seconds by default
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

export async function resetInactivityTimer(client, message) {
  const channelId = message.channelId;

  if (inactivityTimers[channelId]) {
    clearTimeout(inactivityTimers[channelId]);
    console.log(`Cleared timer for channel ${channelId}`);
  }

  inactivityTimers[channelId] = setTimeout(async () => {
    console.log(
      `No activity detected for the inactivity period in channel ${channelId}. Performing scheduled tasks...`
    );

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
        const { promptTemplate, messageObjects } =
          await forcedInteractionPromptFormatter(message);

        const chainResponse = await llmChatCall(
          promptTemplate,
          messageObjects,
          []
        );

        const lastMessageFromBot = await isLastMessageFromBot(channel);
        if (!lastMessageFromBot) {
          await sendInteractionMessageInParts(
            channel,
            chainResponse,
            messageObjects
          );
        } else {
          console.log("Last message was from a bot. Skipping response.");
        }
      }
    } catch (error) {
      console.error("Error in inactivity timer task:", error);
    } finally {
      delete inactivityTimers[channelId];
      console.log(`Timer removed for channel ${channelId}`);
    }
  }, INACTIVITY_PERIOD);

  console.log(`Set timer for channel ${channelId}`);
}
