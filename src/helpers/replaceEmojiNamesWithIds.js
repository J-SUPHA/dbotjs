export default async function replaceEmojiNamesWithIds(text, guild) {
  // Regular expression to find words enclosed in ':'
  const regex = /:(\w+):/g;
  let match;

  // If guild is not available, return the text as is
  if (!guild) {
    return text;
  }

  // Loop through all matches in the text
  while ((match = regex.exec(text)) !== null) {
    // Get the emoji by name
    const emoji = guild.emojis.cache.find((e) => e.name === match[1]);
    if (emoji) {
      // Determine the prefix based on whether the emoji is animated
      const prefix = emoji.animated ? "a" : "";
      // Replace the matched text with the correct emoji format <a:name:id> for animated or <:name:id> for static
      text = text.replace(
        `:${match[1]}:`,
        `<${prefix}:${emoji.name}:${emoji.id}>`
      );
    }
  }
  return text;
}
