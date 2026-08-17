import client from "./client";

// Backend endpoint jo CNN model ko call karega (Dev 3 ka kaam)
const DISEASE_SCAN_ENDPOINT = "/api/disease/scan";

/**
 * Image ko backend AI model ko bhejta hai diagnosis ke liye
 * @param {string} imageBase64 - base64 encoded image string
 * @returns {Promise<{disease: string, confidence: string, treatment: string}>}
 */
export async function scanLeafImage(imageBase64) {
  try {
    const response = await client.post(DISEASE_SCAN_ENDPOINT, {
      image: imageBase64,
    });
    return response.data;
  } catch (error) {
    console.error("Disease scan API error:", error);
    throw new Error("Unable to analyze image. Please try again.");
  }
}
