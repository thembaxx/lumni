import type { WebhookDataAccess } from "@/lib/db/data-access";
import type { WebhookEndpoint } from "./types";

export function createRegistry(db: WebhookDataAccess) {
  async function getEndpoints(eventType: string): Promise<WebhookEndpoint[]> {
    const all = await db.webhookEndpoints.toArray();
    return all.filter((ep) => ep.enabled && ep.events.includes(eventType));
  }

  async function createEndpoint(
    input: Pick<WebhookEndpoint, "url" | "events"> & { description?: string },
  ): Promise<string> {
    const now = Date.now();
    const id = crypto.randomUUID();
    await db.webhookEndpoints.put({
      id,
      url: input.url,
      events: input.events,
      description: input.description,
      enabled: true,
      createdAt: now,
      updatedAt: now,
    } satisfies WebhookEndpoint);
    return id;
  }

  async function deleteEndpoint(id: string): Promise<void> {
    await db.webhookEndpoints.delete(id);
  }

  async function listEndpoints(): Promise<WebhookEndpoint[]> {
    return db.webhookEndpoints.toArray();
  }

  return { getEndpoints, createEndpoint, deleteEndpoint, listEndpoints };
}

export type WebhookRegistry = ReturnType<typeof createRegistry>;
