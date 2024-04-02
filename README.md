## README - Application Configuration

### Application Configuration Overview

This application is designed to work seamlessly with most OpenAI-compatible APIs. It allows users to specify any parameters supported by their selected endpoint, offering extensive flexibility and customization for your API interactions.

### Configuring `config.json`

Your `config.json` enables direct, detailed customization for API calls. It supports all parameters for OpenAI and OpenAI-compatible endpoints. This includes, but is not limited to, parameters documented for Azure OpenAI and similar services.

### Configuration Structure

```json
{
  "llmBaseUrl": "your_api_base_url",
  "openAIConfig": {
    // Specify any parameters supported by your endpoint
  }
}
```

- `llmBaseUrl`: Set this to the base URL of your chosen API.
- `openAIConfig`: This object can include any parameters your API endpoint accepts. For OpenAI's API, refer to their documentation for available parameters.

### Supported Parameters

For those using the OpenAI endpoint or Azure OpenAI, you can specify a wide range of parameters to tailor the API's behavior to your needs. These parameters include, but are not limited to:
- Model selection (`model`)
- Maximum token count (`maxTokens`)
- Temperature for randomness control (`temperature`)

A comprehensive list of supported parameters and their functions can be found in the [OpenAI Azure documentation](https://api.python.langchain.com/en/latest/llms/langchain_community.llms.openai.AzureOpenAI.html#).

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
