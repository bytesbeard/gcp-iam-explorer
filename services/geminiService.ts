
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getIAMExplanation(
  scenarioTitle: string,
  isApplied: boolean,
  actionDescription: string
): Promise<string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Explain the security implications of this GCP IAM change in 3 bullet points. 
      Scenario: ${scenarioTitle}. 
      Action taken: ${isApplied ? actionDescription : "Initial state (no custom roles yet)"}.
      Keep it professional, concise, and educational for a DevOps engineer.`,
      config: {
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });

    return response.text || "Unable to generate explanation at this time.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "The IAM model is currently processing. In summary: granting roles at higher hierarchy levels (Org/Folder) ensures consistent access across all child projects via inheritance.";
  }
}
