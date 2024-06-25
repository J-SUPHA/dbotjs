import { processMessage } from "../chatlogic/responseHandler.js";
import { shouldIgnoreMessage } from "../chatlogic/responseLogic.js";
import { resetInactivityTimer } from "../events/timers.js";

export default {
  name: "messageCreate",
  async execute(message, client) {
    if (shouldIgnoreMessage(message, client)) {
      return;
    }

    try {
      await processMessage(message, client);
      await resetInactivityTimer(client, message);
    } catch (error) {
      console.error("Error processing message in messageCreate event:", error);
    }
  },
};
