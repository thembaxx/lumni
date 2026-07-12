import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import { createRegistry } from "../registry";
import { createDispatcher } from "../dispatcher";

describe("webhook dispatcher", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it("creates a delivery record on dispatch", async () => {
    const fetchMock = vi.fn().mockReturnValue(new Promise(() => {})); // never resolves
    vi.stubGlobal("fetch", fetchMock);

    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);
    const dispatcher = createDispatcher({ db, registry });

    await registry.createEndpoint({
      url: "https://example.com/webhook",
      events: ["quiz.completed"],
    });

    await dispatcher.dispatchWebhook("quiz.completed", {
      subject: "mathematics",
      score: 8,
      totalQuestions: 10,
    });

    const deliveries = await db.webhookDeliveries.toArray();
    expect(deliveries).toHaveLength(1);
    expect(deliveries[0]!.event).toBe("quiz.completed");
    expect(deliveries[0]!.status).toBe("retrying");
    expect(deliveries[0]!.attempts).toBe(0);

    vi.unstubAllGlobals();
  });

  it("delivery record updates to success when fetch succeeds", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);
    const dispatcher = createDispatcher({ db, registry });

    await registry.createEndpoint({
      url: "https://example.com/webhook",
      events: ["quiz.completed"],
    });

    await dispatcher.dispatchWebhook("quiz.completed", {
      subject: "mathematics",
      score: 8,
      totalQuestions: 10,
    });

    await vi.runAllTimersAsync();

    const deliveries = await db.webhookDeliveries.toArray();
    expect(deliveries[0]!.status).toBe("success");
    expect(deliveries[0]!.statusCode).toBe(200);
    expect(deliveries[0]!.completedAt).toBeDefined();

    vi.unstubAllGlobals();
  });

  it("does not dispatch when no endpoints match the event", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);
    const dispatcher = createDispatcher({ db, registry });

    await dispatcher.dispatchWebhook("unknown.event", { data: "test" });

    const deliveries = await db.webhookDeliveries.toArray();
    expect(deliveries).toHaveLength(0);
    expect(fetchMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });
});
