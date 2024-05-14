const once = false;
const name = "interactionCreate";

async function invoke(interaction) {
  // Check if the interaction is a command and call the invoke method in the corresponding file
  if (interaction.isChatInputCommand()) {
    try {
      const commandModule = await import(
        `#commands/${interaction.commandName}`
      );
      if (commandModule && typeof commandModule.invoke === "function") {
        await commandModule.invoke(interaction);
      } else {
        console.error(
          `No invoke function found for command: ${interaction.commandName}`
        );
      }
    } catch (error) {
      console.error(
        `Failed to handle command: ${interaction.commandName}`,
        error
      );
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}

export default { once, name, invoke };
