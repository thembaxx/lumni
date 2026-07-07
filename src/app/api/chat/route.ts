import { NextRequest } from "next/server";
import { generateText, streamText, type LanguageModel } from "ai";
import { createGoogle } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/client";
import { buildChatContext } from "@/lib/ai/chat-context";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_NIM_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

function getModels() {
  const models: Array<{ provider: string; model: LanguageModel }> = [];

  if (GEMINI_API_KEY) {
    try {
      const google = createGoogle({ apiKey: GEMINI_API_KEY });
      models.push({ provider: "gemini", model: google("gemini-2.0-flash-lite-001") });
    } catch (err) {
      logError("Chat.getModels.gemini", err);
    }
  }

  if (NVIDIA_API_KEY) {
    try {
      const nvidia = createOpenAI({
        apiKey: NVIDIA_API_KEY,
        baseURL: "https://integrate.api.nvidia.com/v1",
        name: "nvidia",
      });
      models.push({ provider: "nvidia", model: nvidia.chat("meta/llama-3.3-70b-instruct") });
    } catch (err) {
      logError("Chat.getModels.nvidia", err);
    }
  }

  if (GROQ_API_KEY) {
    try {
      const groq = createOpenAI({
        apiKey: GROQ_API_KEY,
        baseURL: "https://api.groq.com/openai/v1",
        name: "groq",
      });
      models.push({ provider: "groq", model: groq.chat("llama-3.3-70b-versatile") });
    } catch (err) {
      logError("Chat.getModels.groq", err);
    }
  }

  return models;
}

function buildUserPrompt(body: {
  message: string;
  history?: { role: string; content: string }[];
}): string {
  const history = body.history ?? [];
  const conversationHistory = history
    .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
    .join("\n\n");
  return conversationHistory
    ? `${conversationHistory}\n\nUser: ${body.message.trim()}\n\nAssistant:`
    : `User: ${body.message.trim()}\n\nAssistant:`;
}

async function tryStreamWithModels(userPrompt: string, systemPrompt: string) {
  const models = getModels();
  if (models.length === 0) {
    throw new Error("No AI providers configured");
  }

  for (const { provider, model } of models) {
    try {
      const result = streamText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxOutputTokens: 1024,
      });
      return result;
    } catch (err) {
      logError(`ChatStream.${provider}`, err);
    }
  }

  throw new Error("All AI providers failed");
}

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export const POST = withRateLimit(
  async (req: NextRequest) => {
    const sessionUserId = await getAuthenticatedUserId();
    if (!sessionUserId) {
      return Response.json(
        { error: "Authentication required" },
        { status: 401, headers: SECURITY_HEADERS },
      );
    }

    const budgetResult = await checkBudget(req, "generate");
    if (!budgetResult.allowed) {
      return budgetResult.response ?? new Response("Budget exceeded", { status: 429 });
    }

    let body: { message: string; history?: { role: string; content: string }[] };
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "Invalid JSON" }, { status: 400, headers: SECURITY_HEADERS });
    }

    if (!body.message?.trim()) {
      return Response.json(
        { error: "Message is required" },
        { status: 400, headers: SECURITY_HEADERS },
      );
    }

    const acceptsStream = req.headers.get("Accept") === "text/event-stream";
    const userPrompt = buildUserPrompt(body);

    const ctx = await buildChatContext().catch(() => "");
    const systemPrompt = ctx
      ? `${CHAT_SYSTEM_PROMPT}\n\n---\nStudent Context:\n${ctx}`
      : CHAT_SYSTEM_PROMPT;

    if (acceptsStream) {
      try {
        const streamResult = await tryStreamWithModels(userPrompt, systemPrompt);

        const stream = streamResult.textStream.pipeThrough(
          new TransformStream({
            transform(chunk, controller) {
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify({ token: chunk })}\n\n`),
              );
            },
            flush(controller) {
              controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
            },
          }),
        );

        try {
          await trackUsage("generate", sessionUserId);
        } catch {
          /* best-effort */
        }

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      } catch (err) {
        logError("ChatStream", err);
        const encoder = new TextEncoder();
        const errorStream = new ReadableStream({
          start(controller) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "AI service unavailable" })}\n\n`),
            );
            controller.close();
          },
        });
        return new Response(errorStream, {
          status: 200, // keep 200 to allow client-side error handling
          headers: { "Content-Type": "text/event-stream" },
        });
      }
    }

    // Non-streaming fallback
    try {
      const models = getModels();
      if (models.length === 0) {
        return Response.json(
          { error: "No AI providers configured" },
          { status: 500, headers: SECURITY_HEADERS },
        );
      }

      for (const { provider, model } of models) {
        try {
          const { text } = await generateText({
            model,
            system: systemPrompt,
            prompt: userPrompt,
            temperature: 0.7,
            maxOutputTokens: 1024,
          });

          try {
            await trackUsage("generate", sessionUserId);
          } catch {
            /* best-effort */
          }

          return Response.json({ content: text });
        } catch (err) {
          logError(`ChatNonStream.${provider}`, err);
        }
      }

      return Response.json(
        { error: "All AI providers failed" },
        { status: 500, headers: SECURITY_HEADERS },
      );
    } catch (err) {
      logError("ChatNonStream", err);
      return Response.json(
        { error: "Internal server error" },
        { status: 500, headers: SECURITY_HEADERS },
      );
    }
  },
  { max: 15, windowMs: 60_000 },
);
