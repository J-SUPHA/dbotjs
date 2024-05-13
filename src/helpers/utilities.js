export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function splitMessages(content, charLimit) {
  try {
    if (typeof content !== "string") {
      throw new TypeError("Content must be a string");
    }

    const parts = [];
    let currentPart = "";

    content.split(" ").forEach((word) => {
      if (currentPart.length + word.length + 1 > charLimit) {
        parts.push(currentPart);
        currentPart = word;
      } else {
        currentPart += `${currentPart.length > 0 ? " " : ""}${word}`;
      }
    });

    if (currentPart.length) {
      parts.push(currentPart);
    }
    return parts;
  } catch (error) {
    console.error("Error splitting messages:", error);
    return []; // Ensures return is always iterable
  }
}
