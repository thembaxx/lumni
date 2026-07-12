import type { DataAccess } from "@/lib/db/data-access";
import { logError } from "@/lib/shared/logger";
import type { WebhookDelivery } from "./types";

interface DispatcherDeps {
  db: Pick<DataAccess, "webhookEndpoints" | "webhookDeliveries">;
  registry: { getEndpoints(eventType: string): Promise<Array<{ id: string; url: string }>> };
}

export function createDispatcher(deps: DispatcherDeps) {
  async function dispatchWebhook(event: string, payload: Record<string, unknown>): Promise<void> {
    const endpoints = await deps.registry.getEndpoints(event);
    if (endpoints.length === 0) return;

    const payloadStr = JSON.stringify(payload);

    for (const endpoint of endpoints) {
      const delivery: Omit<WebhookDelivery, "id"> = {
        endpointId: endpoint.id,
        event,
        payload: payloadStr,
        status: "retrying",
        attempts: 0,
        createdAt: Date.now(),
      };

      const id = await deps.db.webhookDeliveries.add(delivery);
      attemptDelivery(id, endpoint.url, payloadStr, 3);
    }
  }

  async function attemptDelivery(
    deliveryId: number,
    url: string,
    payload: string,
    retriesLeft: number,
  ): Promise<void> {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      });

      await deps.db.webhookDeliveries.update(deliveryId, {
        status: response.ok ? "success" : "failed",
        statusCode: response.status,
        attempts: 4 - retriesLeft,
        completedAt: Date.now(),
      });
    } catch (err) {
      if (retriesLeft > 0) {
        const backoff = [10_000, 60_000, 300_000][3 - retriesLeft];
        setTimeout(() => attemptDelivery(deliveryId, url, payload, retriesLeft - 1), backoff);
        await deps.db.webhookDeliveries.update(deliveryId, {
          status: "retrying",
          attempts: 4 - retriesLeft,
          nextRetryAt: Date.now() + backoff,
        });
      } else {
        await deps.db.webhookDeliveries.update(deliveryId, {
          status: "failed",
          attempts: 3,
          completedAt: Date.now(),
        });
      }
      logError("Webhook.delivery", err);
    }
  }

  return { dispatchWebhook };
}

export type WebhookDispatcher = ReturnType<typeof createDispatcher>;
