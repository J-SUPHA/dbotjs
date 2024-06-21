import { shouldReply } from "../helpers/shouldReply.js";
import { forcedInteractionPromptFormatter } from "../memory/promptFormatter.js";
import { llmChatCall } from "../chatlogic/llmCall.js";
import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

const INACTIVITY_PERIOD = process.env.INACTIVITY_PERIOD || 10 * 1 * 1000; // 10 seconds by default
const inactivityTimers = {}; // Object to store timers for each channel

export function resetInactivityTimer(client, message) {
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

        const channel = client.channels.cache.get(channelId);
        if (channel) {
          sendInteractionMessageInParts(message, chainResponse.content);
        } else {
          console.error(`Channel with ID ${channelId} not found.`);
        }
      }
    } catch (error) {
      console.error("Error determining if bot should reply:", error);
    }

    delete inactivityTimers[channelId];
    console.log(`Timer removed for channel ${channelId}`);
  }, INACTIVITY_PERIOD);

  console.log(`Set timer for channel ${channelId}`);
}
