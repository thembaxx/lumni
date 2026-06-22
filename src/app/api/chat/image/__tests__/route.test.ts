import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGenerateWithSystem = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/lib/ai/client", () => ({
  CHAT_SYSTEM_PROMPT: "You are a helpful study assistant",
  generateWithSystem: mockGenerateWithSystem,
}));

const { NextRequest } = await import("next/server");
const { POST } = await import("../route");

describe("POST /api/chat/image", () => {
  beforeEach(() => {
    mockGenerateWithSystem.mockReset();
  });

  test("missing imageUrl returns 400", async () => {
    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("No image provided");
  });

  test("AI unavailable returns 500", async () => {
    mockGenerateWithSystem.mockResolvedValue({
      available: false,
      error: "All AI providers failed",
    });

    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "http://example.com/img.png" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("All AI providers failed");
  });

  test("valid request returns content and provider", async () => {
    mockGenerateWithSystem.mockResolvedValue({
      content: "This image shows a diagram of a cell.",
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "http://example.com/cell.png" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.content).toBe("This image shows a diagram of a cell.");
    expect(body.provider).toBe("gemini");
  });

  test("valid request with imageName includes name in prompt", async () => {
    mockGenerateWithSystem.mockResolvedValue({
      content: "Analysis of cell diagram",
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({
        imageUrl: "http://example.com/cell.png",
        imageName: "cell-diagram",
      }),
    });
    await POST(req);

    expect(mockGenerateWithSystem).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining("cell-diagram"),
      expect.objectContaining({ imageUrl: "http://example.com/cell.png" }),
    );
  });

  test("no content in response uses fallback message", async () => {
    mockGenerateWithSystem.mockResolvedValue({
      content: undefined,
      provider: "gemini",
      available: true,
    });

    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "http://example.com/img.png" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.content).toBe("I can see your image. How can I help you with it?");
  });

  test("invalid JSON body returns 500", async () => {
    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toContain("JSON");
  });

  test("internal error returns 500", async () => {
    mockGenerateWithSystem.mockRejectedValue(new Error("Something broke"));

    const req = new NextRequest("http://localhost/api/chat/image", {
      method: "POST",
      body: JSON.stringify({ imageUrl: "http://example.com/img.png" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("Something broke");
  });
});
