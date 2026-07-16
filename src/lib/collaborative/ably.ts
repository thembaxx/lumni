import * as Ably from "ably";
import { logError } from "@/lib/shared/logger";

let restClient: Ably.Rest | null = null;

function getRestClient(): Ably.Rest {
  if (!restClient) {
    const key = process.env.ABLY_API_KEY;
    if (!key) {
      throw new Error("ABLY_API_KEY is not set");
    }
    restClient = new Ably.Rest({ key });
  }
  return restClient;
}

export interface CollaborativeAblyToken {
  token: string;
  capability: Record<string, string[]>;
  clientId: string;
}

export async function createCollaborativeTokenRequest(
  userId: string,
  sessionId: string,
  role: "host" | "participant" = "participant",
): Promise<CollaborativeAblyToken> {
  const client = getRestClient();

  const capabilities: Record<string, string[]> = {
    [`chat-sessions:${sessionId}`]: ["subscribe", "presence", "history"],
    [`whiteboard:${sessionId}`]: ["publish", "subscribe", "presence"],
    [`voice:${sessionId}`]: ["publish", "subscribe"],
    [`session-control:${sessionId}`]: role === "host" ? ["publish", "subscribe"] : ["subscribe"],
  };

  const tokenRequest = await client.auth.createTokenRequest({
    clientId: userId,
    capability: capabilities as unknown as string,
    ttl: 60 * 60 * 1000, // 1 hour
  });

  const tokenData = tokenRequest as unknown as { token: string };

  return {
    token: tokenData.token,
    capability: capabilities,
    clientId: userId,
  };
}

export async function createCollaborativeToken(
  userId: string,
  sessionId: string,
  role: "host" | "participant" = "participant",
): Promise<string> {
  const tokenData = await createCollaborativeTokenRequest(userId, sessionId, role);
  return tokenData.token;
}

export async function endSessionOnAbly(sessionId: string): Promise<void> {
  try {
    const client = getRestClient();
    const channel = client.channels.get(`chat-sessions:${sessionId}`);
    await channel.publish("session.end", { sessionId, endedAt: Date.now() });
  } catch (err) {
    logError("Ably.endSession", err);
  }
}

export async function getSessionParticipants(
  sessionId: string,
): Promise<{ clientId: string; data: unknown }[]> {
  try {
    const client = getRestClient();
    const channel = client.channels.get(`chat-sessions:${sessionId}`);
    const presence = await channel.presence.get();
    return presence as unknown as { clientId: string; data: unknown }[];
  } catch (err) {
    logError("Ably.getSessionParticipants", err);
    return [];
  }
}

export async function sendSystemMessage(
  sessionId: string,
  message: string,
  type: "info" | "warning" | "error" = "info",
): Promise<void> {
  try {
    const client = getRestClient();
    const channel = client.channels.get(`chat-sessions:${sessionId}`);
    await channel.publish("system", { message, type, timestamp: Date.now() });
  } catch (err) {
    logError("Ably.sendSystemMessage", err);
  }
}
