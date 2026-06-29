import { NextRequest } from "next/server";
import { CHAT_SYSTEM_PROMPT, generateWithSystem } from "@/lib/ai/client";
import { buildChatContext } from "@/lib/ai/chat-context";
import { runWithAICallContext } from "@/lib/ai/call-context";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { logError } from "@/lib/shared/logger";

export async function POST(req: NextRequest) {
  const budgetResult = await checkBudget(req, "generate");
  if (!budgetResult.allowed) {
    return budgetResult.response ?? new Response("Budget exceeded", { status: 429 });
  }
  const userId = budgetResult.userId;

  let body: { message: string; history?: { role: string; content: string }[] };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.message?.trim()) {
    return Response.json({ error: "Message is required" }, { status: 400 });
  }

  const acceptsStream = req.headers.get("Accept") === "text/event-stream";

  const userPrompt = (() => {
    const history = body.history ?? [];
    const conversationHistory = history
      .map((h) => `${h.role === "user" ? "User" : "Assistant"}: ${h.content}`)
      .join("\n\n");
    return conversationHistory
      ? `${conversationHistory}\n\nUser: ${body.message.trim()}\n\nAssistant:`
      : `User: ${body.message.trim()}\n\nAssistant:`;
  })();

  const invokeGenerate = async () => {
    const ctx = await buildChatContext().catch(() => "");
    const systemPrompt = ctx
      ? `${CHAT_SYSTEM_PROMPT}\n\n---\nStudent Context:\n${ctx}`
      : CHAT_SYSTEM_PROMPT;

    return generateWithSystem(systemPrompt, userPrompt, {
      temperature: 0.7,
      maxTokens: 1024,
    });
  };

  if (acceptsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const result = await runWithAICallContext({ consentGranted: true }, invokeGenerate);

          if (!("available" in result) || !result.available) {
            const err = (result as { error?: string }).error || "AI unavailable";
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err })}\n\n`));
            controller.close();
            return;
          }

          const content = (result as { content?: string }).content || "";
          const words = content.split(/(?<=\s)/);

          for (const word of words) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ token: word })}\n\n`));
            await new Promise((r) => setTimeout(r, 15));
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          logError("ChatStream", err);
          try {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ error: "Internal server error" })}\n\n`),
            );
            controller.close();
          } catch {
            // ignore close errors
          }
        }
      },
    });

    try {
      await trackUsage("generate", userId ?? "anonymous");
    } catch {
      // best-effort
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  // Non-streaming fallback
  try {
    const result = await runWithAICallContext({ consentGranted: true }, invokeGenerate);

    if (!("available" in result) || !result.available) {
      const err = (result as { error?: string }).error || "AI unavailable";
      return Response.json({ error: err }, { status: 500 });
    }

    const content = (result as { content?: string }).content || "";

    try {
      await trackUsage("generate", userId ?? "anonymous");
    } catch {
      // best-effort
    }

    return Response.json({ content });
  } catch (err) {
    logError("ChatNonStream", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
