import { db } from "./index.js";
import removeBotName from "../helpers/removeBotName.js";
import { getLastXMessages } from "./chatlog-functions.js";
import config from "../config.js";
import getMessageType from "../utils/message-type.js";
import retrieveVectorSearch from "./vectorSearch.js";

export async function summaryFormatter(message, client) {
  const k = config.k;
  const channelType = getMessageType(message);

  let vectorMemory = "";
  try {
    vectorMemory = await retrieveVectorSearch(message);
  } catch (error) {
    console.error("Failed to retrieve vector memory:", error);
  }

  try {
    // Fetching k + 10 messages to get the 10 messages before the last k messages
    const messages = await getLastXMessages(
      message.channelId,
      k + 10,
      channelType
    );

    if (messages.length > k) {
      // Select the 10 messages before the last k messages
      const messagesToSummarize = messages.slice(0, 10);

      // Format these messages for summarization
      const formattedMessages = messagesToSummarize
        .map(
          (msg) =>
            `${msg.name}: ${removeBotName(
              client.user.username,
              msg.clean_content
            )}`
        )
        .join("\n");

      // Send these formatted messages to a summarizer
      const summary = await summarizeMessages(formattedMessages);

      return summary; // Return or handle the summary
    } else {
      return "Not enough messages to summarize.";
    }
  } catch (error) {
    console.error(
      `Failed to format messages for ${channelType} with channel ID ${message.channelId}:`,
      error
    );
    throw error; // Or handle the error more gracefully if preferred
  }
}
