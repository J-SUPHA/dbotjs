import { SlashCommandBuilder } from "discord.js";
import { logDetailedInteraction } from "../memory/chatLog.js";
// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("example")
    .setDescription("An example command.")
    .addStringOption((option) =>
      option
        .setName("example")
        .setDescription("An example option.")
        .setRequired(true)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
// invoke will do nothing then delete the message after 1 minute
const invoke = (interaction) => {
  console.log(interaction);
  const example = interaction.options.getString("example");
  const displayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  const actionString = `${displayName} used example and said: ${example}`;

  const handleInteraction = async () => {
    await logDetailedInteraction(interaction, actionString);
    console.log(example);
  };

  handleInteraction();
  interaction
    .reply({
      content: "This is an example command.",
      ephemeral: true,
    })
    .then((msg) => {
      setTimeout(() => {
        msg.delete();
      }, 6000);
    });
};

export { create, invoke };
