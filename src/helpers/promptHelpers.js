export async function interactionChannelType(interaction) {
  const user = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  if (interaction.channel.guildId) {
    // get name of server and channel
    const guild = await interaction.client.guilds.fetch(
      interaction.channel.guildId
    );
    const channel = guild.channels.cache.get(interaction.channel.id);

    return (
      "group chat on the server " +
      guild.name +
      ", in the channel " +
      channel.name
    );
  } else {
    return "a private DM with " + user;
  }
}

export async function channelType(message) {
  const user = message.member
    ? message.member.displayName
    : message.author.globalName;
  if (message.channel.guildId) {
    const guild = await message.client.guilds.fetch(message.channel.guildId);
    const channel = guild.channels.cache.get(message.channel.id);

    return "Server - " + guild.name + " Channel - " + channel.name;
  } else {
    return user + "'s DMs";
  }
}
