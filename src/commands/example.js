import { SlashCommandBuilder } from "discord.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("example")
    .setDescription("An example command.");

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
// invoke will do nothing then delete the message after 1 minute
const invoke = (interaction) => {
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
