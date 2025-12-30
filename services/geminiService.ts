
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ArchitectInsight {
  security: string;
  inheritance: string;
  bestPractice: string;
}

export async function getIAMExplanation(
  scenarioTitle: string,
  isApplied: boolean,
  actionDescription: string,
  scenarioContext: string
): Promise<ArchitectInsight | string> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a Senior Google Cloud Security Architect. 
      Analyze this IAM scenario:
      
      SCENARIO: ${scenarioTitle}
      RESOURCE HIERARCHY: ${scenarioContext}
      ACTION: ${isApplied ? actionDescription : "Analyzing baseline state"}

      Provide a BRIEF, high-impact analysis of the security implications, inheritance flow, and best practices.`,
      config: {
        temperature: 0.4,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            security: {
              type: Type.STRING,
              description: "Max 2 sentences on risk or benefit.",
            },
            inheritance: {
              type: Type.STRING,
              description: "Max 2 sentences on how permissions flow down.",
            },
            bestPractice: {
              type: Type.STRING,
              description: "Max 2 sentences on the recommended production approach.",
            },
          },
          required: ["security", "inheritance", "bestPractice"],
        },
      }
    });

    const text = response.text;
    if (text) {
      return JSON.parse(text) as ArchitectInsight;
    }
    throw new Error("Empty response");
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      security: "Hierarchy depth increases the blast radius of permissions. Auditing is required.",
      inheritance: "Permissions are additive and propagate from higher nodes (Org) to lower ones (Project).",
      bestPractice: "Always prefer Google Groups over individual users to simplify role management."
    };
  }
}
