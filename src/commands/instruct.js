import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { logDetailedInteraction } from "../memory/chatLog.js";
import llmCall from "../chatlogic/llmCall.js";
import sendMessageInParts from "../helpers/splitMessages.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const create = () => {
  const command = new SlashCommandBuilder()
    .setName("instruct")
    .setDescription("Zero shot instruct the llm")
    .addStringOption((option) =>
      option
        .setName("instructions")
        .setDescription("The instructions to give to the llm")
        .setRequired(true)
    );

  return command.toJSON();
};

// Called by the interactionCreate event listener when the corresponding command is invoked
// invoke will do nothing then delete the message after 1 minute
const invoke = (interaction) => {
  //   console.log(interaction);
  const example = interaction.options.getString("instructions");
  const displayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  const instructTemplate = `<|im_start|>system
You are an AI assistant. Write a response that appropriately completes the request.<|im_end|>
<|im_start|>user
${example}<|im_end|>
<|im_start|>assistant`;

  const handleInteraction = async () => {
    const response = await llmCall(instructTemplate, ["<|im_end|>"]);
    const actionString = `Used the instruct command: '${example}'`;
    await logDetailedInteraction(interaction, actionString);
    sendMessageInParts(interaction, response);
  };

  handleInteraction();

  const embed = new EmbedBuilder()
    .setColor(0x0099ff) // Set a color for the embed
    .setTitle("Command Used")
    .setDescription(`**${displayName}** executed the instruct command`)
    .addFields({ name: "Command", value: example, inline: true })
    .setTimestamp();

  interaction.reply({
    embeds: [embed],
    ephemeral: false,
  });
};

export { create, invoke };
