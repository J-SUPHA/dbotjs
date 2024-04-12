import axios from "axios";
import sharp from "sharp";

export default async function imageCaption(link) {
  const url = "http://47.189.140.220:5003/llava_caption";

  // Function to fetch image from URL and convert to base64
  const imageToBase64 = async (imageUrl) => {
    try {
      // Fetch image as a stream
      const response = await axios({
        method: "get",
        url: imageUrl,
        responseType: "arraybuffer",
      });
      // Convert the response data to a Buffer
      const imageBuffer = Buffer.from(response.data, "binary");
      // Convert image to JPEG format using sharp, if necessary
      const convertedBuffer = await sharp(imageBuffer).jpeg().toBuffer();
      // Convert the image buffer to base64
      return convertedBuffer.toString("base64");
    } catch (error) {
      console.error("Error fetching image:", error);
    }
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
