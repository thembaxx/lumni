export { ToolLoopAgent } from "ai";
export * from "./client";
export type { AIFailure, AIResponse, AIResult } from "./types";

import { isAIConfigured, initAI } from "./client";

let _ensureAICalled = false;

/**
 * Ensure AI providers are initialized. Safe to call multiple times —
 * only initializes once. Replaces the duplicate `if (!isAIConfigured()) { initAI({...}) }`
 * blocks across services.
 */
export function ensureAI(): void {
  if (_ensureAICalled) return;
  if (!isAIConfigured()) {
    initAI({
      geminiApiKey: process.env.GEMINI_API_KEY,
      groqApiKey: process.env.GROQ_API_KEY,
      nvidiaApiKey: process.env.NVIDIA_NIM_API_KEY,
    });
  }
  _ensureAICalled = true;
}
