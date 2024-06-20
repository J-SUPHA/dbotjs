import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { createOpenAIFunctionsAgent, AgentExecutor } from "langchain/agents";
import { logDetailedInteraction } from "../memory/chatLog.js";
import config from "../config.js";
import { sendInteractionMessageInParts } from "../helpers/splitMessages.js";

// Creates an Object in JSON with the data required by Discord's API to create a SlashCommand
const createSlashCommand = () => {
  const command = new SlashCommandBuilder()
    .setName("tavily")
    .setDescription("Search something with Tavily.")
    .addStringOption((option) =>
      option
        .setName("question")
        .setDescription("The question to ask the AI.")
        .setRequired(true)
    );

  return command.toJSON();
};

const handleCommandInteraction = async (interaction) => {
  console.log("Handling interaction:", interaction.commandName);
  const userDisplayName = interaction.member
    ? interaction.member.displayName
    : interaction.user.globalName;
  const userQuestion = interaction.options.getString("question");

  const processInteraction = async () => {
    try {
      await interaction.deferReply(); // Ensure the interaction is deferred

      // The embed will show the name of the user and the avatar of the user along with the question they asked
      const actionLogMessage = `Used the Tavily command: '${userQuestion}'`;
      await logDetailedInteraction(interaction, actionLogMessage);
      const responseEmbed = new EmbedBuilder()
        .setColor(0x0099ff) // Set a color for the embed
        .setTitle("Tavily Search") // The title of the embed
        .setAuthor({
          name: interaction.user.username,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setDescription(`${interaction.user.username} asked: ${userQuestion}`) // The description of the embed
        .setTimestamp()
        .setFooter({
          text: "Tavily Search",
          iconURL: interaction.user.displayAvatarURL(),
        }); // The footer of the embed

      await interaction.followUp({
        embeds: [responseEmbed],
        ephemeral: false,
      });

      const llm = new ChatOpenAI({
        model: "llama3",
        maxTokens: 100,
        repetitionPenalty: 1.3,
        frequencyPenalty: 0.3,
        temperature: 0.5,
        stop: ["assistant\n", "user\n", "assistant\n\n"],
        configuration: {
          baseURL: "http://localhost:11434/v1",
        },
      });
      const prompt = await pull("hwchase17/openai-functions-agent");
      const search = new TavilySearchResults({
        apiKey: config.tavilyApiKey,
      });
      const tools = [search];

      const agent = await createOpenAIFunctionsAgent({
        llm,
        tools,
        prompt,
      });
      const agentExecutor = new AgentExecutor({ agent, tools });
      const response = await agentExecutor.invoke({
        input: userQuestion,
      });
      console.log("Response from OpenAI:", response);
      sendInteractionMessageInParts(response.output, answerResponse);
    } catch (error) {
      console.error("Error processing interaction:", error);
      await interaction.followUp({
        content: "There was an error processing your request.",
        ephemeral: true,
      });
    }
  };

  await processInteraction();
};

export { createSlashCommand as create, handleCommandInteraction as invoke };
