import { describe, expect, it, vi } from "vitest";

const mockSynthesize = vi.hoisted(() => vi.fn());
vi.mock("@/lib/voice-engine", () => ({
  voiceEngine: { synthesize: mockSynthesize },
}));
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => Promise.resolve("test-user")),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/engine/voice/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/engine/voice", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("Voice API Endpoint", () => {
  it("synthesizes text successfully", async () => {
    mockSynthesize.mockResolvedValue({
      audio: "base64audio",
      format: "mp3",
      provider: "gtts",
    });
    const response = await POST(makeRequest({ text: "Hello world" }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ audio: "base64audio", format: "mp3", provider: "gtts" });
  });

  it("returns null audio when synthesis fails", async () => {
    mockSynthesize.mockResolvedValue(null);
    const response = await POST(makeRequest({ text: "Hello" }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ audio: null, format: null, provider: null });
  });

  it("validates that text is required", async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("text is required");
  });

  it("validates that text is non-empty string", async () => {
    const response = await POST(makeRequest({ text: "" }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("text is required");
  });

  it("handles synthesis errors gracefully", async () => {
    mockSynthesize.mockRejectedValue(new Error("TTS provider down"));
    const response = await POST(makeRequest({ text: "Hello" }));
    expect(response.status).toBe(500);
  });
});
