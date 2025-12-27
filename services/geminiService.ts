
import { GoogleGenAI, Type } from "@google/genai";

// Initialize the Google GenAI client using the API key strictly from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getSmartPricingSuggestion = async (jobDetails: {
  weight: number;
  timeHours: number;
  materialType: string;
  complexity: 'low' | 'medium' | 'high';
}) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Suggest a competitive selling price for a 3D printed object with the following details: 
      Weight: ${jobDetails.weight}g, 
      Time: ${jobDetails.timeHours} hours, 
      Material: ${jobDetails.materialType}, 
      Complexity: ${jobDetails.complexity}.
      Return the answer in JSON format with fields: suggestedPrice, reasoning, and marketTips.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestedPrice: { type: Type.NUMBER },
            reasoning: { type: Type.STRING },
            marketTips: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ['suggestedPrice', 'reasoning', 'marketTips']
        }
      }
    });

    // Extracting text output from response property .text as per guidelines.
    const resultText = response.text;
    return resultText ? JSON.parse(resultText) : null;
  } catch (error) {
    console.error('Error getting smart pricing:', error);
    return null;
  }
};
