import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL, REPORT_PROMPT } from "../constants";

export const generateZwdsReport = async (
  imagesBase64: string[],
): Promise<string> => {
  try {
    const apiKey = "AIzaSyCwh75PD5dsF-DsEcrX3eVGQqM7CEa6hiw";

    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenerativeAI(apiKey);

    const model = ai.getGenerativeModel({
      model: GEMINI_MODEL,
    });

    const imageParts = imagesBase64.map((img) => ({
      inlineData: {
        mimeType: "image/jpeg",
        data: img,
      },
    }));

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [...imageParts, { text: REPORT_PROMPT }],
        },
      ],
    });

    return result.response.text() || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw new Error("Failed to generate report with Gemini.");
  }
};
