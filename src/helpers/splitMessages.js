import { logDetailedMessage } from "../memory/chatLog.js";
import replaceEmojiNamesWithIds from "../helpers/replaceEmojiNamesWithIds.js";
import removeBotName from "../chatlogic/removeBotName.js";

function splitMessages(content, charLimit) {
  const parts = [];
  let currentPart = "";

  content.split(" ").forEach((word) => {
    if (currentPart.length + word.length + 1 > charLimit) {
      parts.push(currentPart);
      currentPart = word;
    } else {
      currentPart += `${currentPart.length > 0 ? " " : ""}${word}`;
    }
  });

  if (currentPart.length) {
    parts.push(currentPart);
  }
  return parts;
}

// rus the message through the replaceEmojiNamesWithIds function then return the message
export default async function sendMessageInParts(interaction, content) {
  content = await replaceEmojiNamesWithIds(content, interaction.guild);
  const CHAR_LIMIT = 2000;
  if (content.length <= CHAR_LIMIT) {
    const sentMessage = await interaction.channel.send(
      removeBotName(interaction.client.user.username, content)
    );
    await logDetailedMessage(
      sentMessage,
      interaction.client,
      sentMessage.cleanContent
    );
  } else {
    const messageParts = splitMessages(content, CHAR_LIMIT);
    for (const part of messageParts) {
      const sentMessage = await interaction.channel.send(
        removeBotName(interaction.client.user.username, part)
      );
      await logDetailedMessage(
        sentMessage,
        interaction.client,
        sentMessage.cleanContent
      );
      await delay(1000); // Wait for 1 second between message parts to avoid rate limiting
    }
  }
}
