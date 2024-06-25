import { TavilySearchResults } from "@langchain/community/tools/tavily_search";

const search = new TavilySearchResults({
  apiKey: "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",
  maxResults: 3,
});

const query = "What is the weather in dallas?";

async function runQuery() {
  try {
    const resultsString = await search.call(query);
    const results = JSON.parse(resultsString);
    formatResults(results);
  } catch (error) {
    console.error("Error:", error);
  }
}

function formatResults(results) {
  if (Array.isArray(results)) {
    results.forEach((result, index) => {
      console.log(`Result ${index + 1}:`);
      console.log(`Title: ${result.title}`);
      console.log(`URL: ${result.url}`);
      if (result.content) {
        try {
          const content = JSON.parse(result.content);
          console.log(
            `Location: ${content.location.name}, ${content.location.region}, ${content.location.country}`
          );
          console.log(
            `Temperature: ${content.current.temp_c}°C (${content.current.temp_f}°F)`
          );
          console.log(`Condition: ${content.current.condition.text}`);
          console.log(
            `Wind: ${content.current.wind_mph} mph (${content.current.wind_kph} kph) from ${content.current.wind_dir}`
          );
          console.log(`Humidity: ${content.current.humidity}%`);
          console.log(
            `Pressure: ${content.current.pressure_mb} mb (${content.current.pressure_in} in)`
          );
          console.log(
            `Visibility: ${content.current.vis_km} km (${content.current.vis_miles} miles)`
          );
          console.log(`UV Index: ${content.current.uv}`);
          console.log(
            `Gust: ${content.current.gust_mph} mph (${content.current.gust_kph} kph)`
          );
        } catch (e) {
          console.log("Content:", result.content);
        }
      }
      console.log("\n");
    });
  } else {
    console.log("The results are not an array:", results);
  }
}

runQuery();
