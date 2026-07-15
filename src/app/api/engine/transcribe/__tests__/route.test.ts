import { beforeEach, describe, expect, it, vi } from "vitest";

const mockTranscribeWithFallback = vi.hoisted(() => vi.fn());
vi.mock("@/lib/stt-engine", () => ({
  createSTTEngine: () => ({
    transcribeWithFallback: mockTranscribeWithFallback,
  }),
}));

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));
vi.mock("@/lib/server/auth", () => ({
  getAuthenticatedUserId: vi.fn(() => Promise.resolve("test-user")),
}));

import { NextRequest } from "next/server";
import { POST } from "@/app/api/engine/transcribe/route";

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/engine/transcribe", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("STT API Endpoint", () => {
  beforeEach(() => {
    mockTranscribeWithFallback.mockReset();
  });

  it("validates that audio is required", async () => {
    const response = await POST(makeRequest({}));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("audio is required");
  });

  it("validates that audio is a non-empty string", async () => {
    const response = await POST(makeRequest({ audio: "" }));
    const data = await response.json();
    expect(response.status).toBe(400);
    expect(data.error).toBe("audio is required");
  });

  it("returns transcription from STT engine on success", async () => {
    mockTranscribeWithFallback.mockResolvedValue({
      text: "hello world",
      confidence: 0.95,
      provider: "deepgram",
    });
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ text: "hello world", confidence: 0.95, provider: "deepgram" });
  });

  it("returns null on STT engine failure", async () => {
    mockTranscribeWithFallback.mockRejectedValue(new Error("stt error"));
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(data).toEqual({ text: null, confidence: null, provider: null });
  });

  it("handles empty result from STT engine", async () => {
    mockTranscribeWithFallback.mockResolvedValue({
      text: null,
      confidence: null,
      provider: null,
    });
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(data).toEqual({ text: null, confidence: null, provider: null });
  });
});
