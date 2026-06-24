import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.hoisted(() => vi.fn());
vi.stubGlobal("fetch", mockFetch);

vi.mock("@/lib/shared/logger", () => ({ logError: vi.fn() }));

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
    mockFetch.mockReset();
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

  it("returns null result when DEEPGRAM_API_KEY is absent (fail open)", async () => {
    const key = process.env.DEEPGRAM_API_KEY;
    delete process.env.DEEPGRAM_API_KEY;
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    process.env.DEEPGRAM_API_KEY = key;
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ text: null, confidence: null, provider: null });
  });

  it("returns transcription from Deepgram on success", async () => {
    process.env.DEEPGRAM_API_KEY = "test-key";
    mockFetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: {
            channels: [{ alternatives: [{ transcript: "hello world", confidence: 0.95 }] }],
          },
        }),
    });
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data).toEqual({ text: "hello world", confidence: 0.95, provider: "deepgram" });
  });

  it("returns null on Deepgram API error", async () => {
    process.env.DEEPGRAM_API_KEY = "test-key";
    mockFetch.mockResolvedValue({ ok: false, status: 500 });
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(data).toEqual({ text: null, confidence: null, provider: null });
  });

  it("returns null on network error", async () => {
    process.env.DEEPGRAM_API_KEY = "test-key";
    mockFetch.mockRejectedValue(new Error("network error"));
    const response = await POST(makeRequest({ audio: "dGVzdA==" }));
    const data = await response.json();
    expect(data).toEqual({ text: null, confidence: null, provider: null });
  });
});
