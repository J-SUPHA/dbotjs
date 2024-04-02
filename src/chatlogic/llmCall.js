export default async function llmCall(prompt) {
  const url = "http://api.ausboss.io/v1/completions";
  const postData = {
    prompt: prompt,
    max_tokens: 500,
    temperature: 1,
    top_p: 0.9,

    Preset: "Big O",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(postData),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    console.log(data);
    return data;
  } catch (error) {
    console.error("Request failed:", error);
  }
}
