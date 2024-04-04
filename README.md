
# Bot Configuration

---

## Quick Start Guide


### Step 1: Install Dependencies

First, install the necessary packages with npm:

```bash
npm install
```

### Step 2: Configure Environment

Set up your environment variables for secure access to Discord and OpenAI:

- **Rename `.env` File**:  
  Copy or rename the `example.env` to `.env`.

- **Set Bot Token**:  
  Open the `.env` file and insert your Discord bot token next to `BOT_TOKEN`.

    ```plaintext
    BOT_TOKEN=your_discord_bot_token_here
    ```

- **Set OpenAI API Key** (Optional):  
  If you're using OpenAI, add your API key to the same `.env` file.

    ```plaintext
    OPENAI_API_KEY=your_openai_api_key_here
    ```

### Step 3: Configure Bot Settings

Adjust your bot's behavior and AI settings:

- **Rename `config.json` File**:  
  Copy or rename the `example-config.json` to `config.json`.

- **Customize Settings**:  
  Edit `config.json` to include the channel IDs to listen on and pass in your custom endpoint or leave out to use `https://api.openai.com/v1`

    ```json
    {
      "llmBaseUrl": "http://127.0.0.1:5000/v1",
      "channelIds": ["1234567891011121314", "1234567891011121314"],
      "openAIConfig": {
        "stop": ["\n"]
      },
      "ignorePatterns": [".", "!"]
    }
    ```

### Step 4: Start the Bot

Launch your bot with the following command. (Tested on Node.js version 20.9.0):

```bash
npm run dev
```

---

# More Details

---

## `.env` Setup

For basic functionality, store your Discord bot token:

```
BOT_TOKEN=YOUR_BOT_TOKEN
```

If using OpenAI add:

```
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```


This application is designed to work seamlessly with most OpenAI-compatible APIs. It allows users to specify any parameters supported by their selected endpoint.

### Configuring `config.json`

Your `config.json` enables direct, detailed customization for API calls. It supports most parameters for OpenAI and OpenAI-compatible endpoints. This includes, but is not limited to, parameters documented for OpenAI and similar services.

### Configuration Structure

```json
{
  "llmBaseUrl": "http://127.0.0.1:5000/v1",
  "channelIds": ["1148253350404575352", "1153875844251529338"],
  "openAIConfig": {
    "maxTokens": 200,
    "stop": ["\n"]
    // Specify any parameters supported by your endpoint
  },
  "ignorePatterns": [".", "!", "/"]
}

```

- **llmBaseUrl**: Leave blank if using openai. If you are using something like Tabby or Oobabooga then you would put in the endpoint address followed by /v1. 
- **channelIds**: Specifies which Discord channels the bot will listen to and reply within. Only messages from these channels will be processed.

- **openAIConfig**: Contains parameters for the API requests, allowing for detailed customization of the language model's behavior.
  - `maxTokens`, `temperature`, `topP`, `minP`, `repetitionPenalty` are among the customizable parameters to tailor the AI's responses.
  - `stop`: An array of tokens that signal the language model to stop generating further text. Useful for defining clear end-points in generated content.

- **ignorePatterns**: Defines patterns (typically starting characters) that the bot will ignore. Messages starting with any characters or strings listed here will not trigger a response. Useful for filtering out commands or other bot interactions.

### Supported Parameters

For those using the OpenAI endpoint, you can specify a wide range of parameters to tailor the API's behavior to your needs. These parameters include, but are not limited to:
- Model selection (`model`)
- Maximum token count (`maxTokens`)
- Temperature for randomness control (`temperature`)

A comprehensive list of the langchain.js supported parameters and their functions can be found in the [OpenAI documentation](https://api.python.langchain.com/en/latest/llms/langchain_community.llms.openai.OpenAI.html#langchain_community.llms.openai.OpenAI).

### Example Configuration

```json
{
  "llmBaseUrl": "http://127.0.0.1:5000/v1",
  "openAIConfig": {
    "maxTokens": 100,
    "temperature": 0.7
    // Additional parameters as needed
  }
}
```

### Security and Flexibility

Sensitive information, such as API keys or BOT Tokens, should be managed through environment variables to maintain security. The `config.json` file is intended for non-sensitive configurations, allowing for easy adjustments without code changes.


Certainly! Let's adjust the explanation for a group chat scenario and mention the use of an SQL database for message history:

---

## Dynamic Prompt Construction with `prompt.txt`

In our bot's architecture, the `prompt.txt` file is a pivotal element for creating dynamic, context-aware prompts that the bot sends to the language learning model (LLM). This mechanism is especially crucial for group chat interactions, where context and continuity play significant roles in generating relevant responses.

### How `prompt.txt` Works

`prompt.txt` serves as a template that includes placeholders for dynamically inserting content. These placeholders include the bot’s display name (`{{char}}`), the name of the user sending the message (`{{user}}`), and the recent chat history (`{{history}}`). This approach allows for personalized and context-rich interactions with the LLM.

### Group Chat Example

Consider a group chat where multiple users interact, and the bot, named "AidBot," participates. Here's how a `prompt.txt` might be structured:

```
You are a helpful assistant named {{char}}.
{{history}}
```

### From Template to Contextual Prompt

When preparing a prompt for the LLM, the bot replaces placeholders with actual data:

- `{{char}}` becomes "AidBot."
- `{{history}}` is filled with the last 10 messages from the group chat, as stored in the SQL database. This inclusion is crucial as it provides the LLM with the necessary context to generate coherent and contextually appropriate responses.

#### Example of a Formatted Prompt

Given a series of interactions in a group chat, the formatted prompt might look as follows:

```
You are a helpful assistant named AidBot.
Alex: Does anyone remember the capital of France?
Jordan: It's Paris, right?
Alex: Yes, thanks! AidBot, can you list all the countries in the EU?
AidBot: Sure, the EU consists of...
Kim: AidBot, what's the weather like in Paris today?
AidBot:
```

### Incorporating SQL Database for Message History

The bot's ability to insert the recent chat history into each prompt relies on pulling data from an SQL database where all messages are logged. This setup ensures that even in dynamic and fast-paced group chats, the bot remains contextually aware and provides responses that reflect the ongoing conversation.
