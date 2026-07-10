export { ToolLoopAgent } from "ai";
export * from "./client";
export type { AIFailure, AIResponse, AIResult } from "./types";

import { isAIConfigured, initAI } from "./client";

/**
 * Ensure AI providers are initialized. Returns true if AI is available
 * after initialization. Safe to call multiple times — only initializes
 * on first call when not yet configured.
 */
export function ensureAI(): boolean {
  if (isAIConfigured()) return true;
  initAI({
    geminiApiKey: process.env.GEMINI_API_KEY,
    groqApiKey: process.env.GROQ_API_KEY,
    nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY,
  });
  return isAIConfigured();
}
