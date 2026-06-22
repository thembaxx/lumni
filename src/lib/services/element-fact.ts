import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import type { AIResponse } from "@/lib/ai/types";

interface ElementFactBody {
  element: {
    atomicNumber: number;
    name: string;
    symbol: string;
  };
}

export const elementFactService = {
  async execute(body: ElementFactBody) {
    const { element } = body;

    if (!isAIConfigured()) {
      initAI({
        geminiApiKey: process.env.GEMINI_API_KEY,
        groqApiKey: process.env.GROQ_API_KEY,
      });
    }

    if (!isAIConfigured()) {
      return {
        fact: `${element.name} (${element.symbol}) is element number ${element.atomicNumber} on the periodic table. [FIXED]`,
      };
    }

    const systemPrompt = `You are a chemistry expert with a passion for sharing fascinating, accurate, and engaging facts about chemical elements. Your facts should be:
  - Scientifically accurate
  - Interesting and engaging for learners
  - Concise (1-2 sentences)
  - Focused on unique properties, historical significance, or surprising applications
  - Free of speculation or unverified claims`;

    const prompt = `Share one interesting, fascinating fact about ${element.name} (symbol: ${element.symbol}, atomic number: ${element.atomicNumber}). Make it engaging and educational, suitable for students learning about the periodic table.`;

    const result = await generateWithSystem(systemPrompt, prompt, {
      temperature: 0.8,
      maxTokens: 150,
    });

    if ("available" in result && !result.available) {
      const errorMsg = "error" in result ? result.error : "Unknown error";
      throw new Error(`AI generation failed: ${errorMsg}`);
    }

    const response = result as AIResponse;
    const cleanedContent = response.content
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .replace(/^[\s\S]*?[.!?]/, (match) => match.trim())
      .trim();

    if (!cleanedContent || cleanedContent.length < 10) {
      throw new Error("Generated fact is too short or empty");
    }

    return { fact: cleanedContent };
  },
};
