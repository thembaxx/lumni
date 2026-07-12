import { describe, it, expect } from "vitest";
import { InMemoryDataAccess } from "@/lib/db";
import { createRegistry } from "../registry";

describe("webhook registry", () => {
  it("creates an endpoint and returns its id", async () => {
    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);

    const id = await registry.createEndpoint({
      url: "https://example.com/webhook",
      events: ["quiz.completed"],
    });

    expect(id).toBeDefined();
    expect(typeof id).toBe("string");
  });

  it("lists created endpoints", async () => {
    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);

    await registry.createEndpoint({
      url: "https://example.com/webhook",
      events: ["quiz.completed"],
    });
    await registry.createEndpoint({
      url: "https://example.com/other",
      events: ["exam.completed"],
    });

    const list = await registry.listEndpoints();
    expect(list).toHaveLength(2);
  });

  it("filters endpoints by event type", async () => {
    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);

    await registry.createEndpoint({
      url: "https://example.com/quiz",
      events: ["quiz.completed"],
    });
    await registry.createEndpoint({
      url: "https://example.com/exam",
      events: ["exam.completed"],
    });

    const quizEndpoints = await registry.getEndpoints("quiz.completed");
    expect(quizEndpoints).toHaveLength(1);
    expect(quizEndpoints[0]!.url).toBe("https://example.com/quiz");
  });

  it("ignores disabled endpoints when filtering by event", async () => {
    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);

    const id = await registry.createEndpoint({
      url: "https://example.com/quiz",
      events: ["quiz.completed"],
    });

    await db.webhookEndpoints.update(id, { enabled: false });

    const endpoints = await registry.getEndpoints("quiz.completed");
    expect(endpoints).toHaveLength(0);
  });

  it("deletes an endpoint by id", async () => {
    const db = new InMemoryDataAccess();
    const registry = createRegistry(db);

    const id = await registry.createEndpoint({
      url: "https://example.com/webhook",
      events: ["quiz.completed"],
    });

    await registry.deleteEndpoint(id);

    const list = await registry.listEndpoints();
    expect(list).toHaveLength(0);
  });
});
