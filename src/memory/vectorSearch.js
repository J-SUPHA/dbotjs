import { ChromaClient } from "chromadb";

export default async function retrieveVectorSearch(message) {
  const client = new ChromaClient();
  let collection;

  try {
    // Retrieve the collection from the database
    collection = await client.getCollection({ name: "dbot" });
  } catch (error) {
    console.error("Failed to retrieve collection:", error);
    return ""; // Handle the collection retrieval error
  }

  let data;
  message.channelId = message.channelId || message.channel.id;

  try {
    // Perform the query on the collection
    data = await collection.get({
      where: { channelId: message.channel.id },
      whereDocument: { $contains: message.cleanContent },
      limit: 5,
    });
  } catch (error) {
    console.error("Failed to query the collection:", error);
    return ""; // Handle the query error
  }

  // Log the data for verification
  console.log("Data retrieved from the collection:", data);

  // Validate the data structure
  if (!Array.isArray(data.metadatas) || data.metadatas.length === 0) {
    console.error("No metadata available to process.");
    return ""; // Return an empty string or handle the error appropriately
  }

  if (!Array.isArray(data.documents) || data.documents.length === 0) {
    console.error("No documents available to process.");
    return ""; // Return an empty string or handle the error appropriately
  }

  // Sort the metadatas array by createdTimestamp
  data.metadatas.sort((a, b) => a.createdTimestamp - b.createdTimestamp);

  // Map each metadata to a formatted string using the corresponding document and join them with newlines
  const stringResults = data.metadatas
    .map((meta, index) => {
      const messageContent = data.documents[index] || "No content";
      return `${meta.username}: ${messageContent}`;
    })
    .join("\n");

  console.log("Vector search results:", stringResults);
  return "\n" + stringResults;
}
