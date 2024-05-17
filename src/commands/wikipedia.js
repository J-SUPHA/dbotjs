import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { WikipediaQueryRun } from "@langchain/community/tools/wikipedia_query_run";

const tool = new WikipediaQueryRun({
  topKResults: 3,
  maxDocContentLength: 1999,
});

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("wikipedia")
    .setDescription("Search Something on Wikipedia")
    .addStringOption((option) =>
      option
        .setName("topic")
        .setDescription("The topic to search on Wikipedia")
        .setRequired(true)
    );

  return command.toJSON();
};

const invoke = (interaction) => {
  //   console.log(interaction);
  const example = interaction.options.getString("topic");

  const handleInteraction = async () => {
    const res = await tool.invoke(example);
    console.log(res);
    const embed = new EmbedBuilder()
      .setColor(0x0099ff) // Set a color for the embed
      .setTitle(res[0].title)
      .setURL(res[0].link)
      .setDescription(res[0].snippet)
      .setTimestamp();
    interaction.reply({
      embeds: [embed],
      ephemeral: false,
    });
  };

  handleInteraction(); // Add await here
};

export { create, invoke };
