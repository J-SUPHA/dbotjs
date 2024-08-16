import axios from "axios";
import https from "https";
import config from "../config.js";

export default async function imageCaption(link) {
  const url = config.llavaBaseUrl + "/llava_caption";

  // Function to fetch image from URL and convert to base64
  const imageToBase64 = async (imageUrl) => {
    return new Promise((resolve, reject) => {
      https.get(imageUrl, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch image: ${response.statusCode}`));
          return;
        }

        const data = [];
        response.on('data', (chunk) => {
          data.push(chunk);
        });

        response.on('end', () => {
          const buffer = Buffer.concat(data);
          const base64Image = buffer.toString('base64');
          resolve(base64Image);
        });
      }).on('error', (err) => {
        reject(err);
      });
    });
  };

  // Function to send the image for captioning
  const captionImage = async (imageBase64, url) => {
    const payload = {
      image: imageBase64,
    };
    try {
      const response = await axios.post(url, payload);
      console.log(response.data.description);
      if (response.data.description) {
        return response.data.description;
      }
    } catch (error) {
      console.error(error);
    }
  };

  // Main function to handle the process
  const processImageFromUrl = async (imageUrl) => {
    const imageBase64 = await imageToBase64(imageUrl);
    return await captionImage(imageBase64, url);
  };

  const imageCaption = await processImageFromUrl(link).catch(console.error);
  return imageCaption;
}