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

export async function createAblyTokenRequest(userId: string): Promise<Ably.TokenRequest> {
  try {
    const client = getRestClient();
    return client.auth.createTokenRequest({
      clientId: userId,
      capability: { "chat-sessions:*": ["subscribe", "presence"] },
    });
  } catch (err) {
    logError("Ably.createTokenRequest", err);
    throw new Error("Failed to create Ably token", { cause: err });
  }
}
