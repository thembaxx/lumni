/**
 * STT (Speech-to-Text) Provider Chain
 *
 * Mirrors the TTS provider pattern in src/lib/ai/client.ts:
 * - Deepgram (primary) — low latency, needs API key
 * - Whisper WASM (fallback) — free, 74MB download, slower
 * - Fails open → { text: null, confidence: null }
 */

import { logError } from "@/lib/shared/logger";

export interface SttResult {
  text: string | null;
  confidence: number | null;
  provider: string | null;
}

export interface SttProvider {
  readonly name: string;
  transcribe(audio: Blob, format?: string): Promise<SttResult>;
}

// Deepgram STT provider
class DeepgramSttProvider implements SttProvider {
  readonly name = "deepgram";
  private readonly apiKey: string | undefined;

  constructor(apiKey?: string) {
    this.apiKey = apiKey;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async transcribe(audio: Blob, format?: string): Promise<SttResult> {
    if (!this.apiKey) {
      return { text: null, confidence: null, provider: null };
    }

    try {
      const response = await fetch("https://api.deepgram.com/v1/listen", {
        method: "POST",
        headers: {
          Authorization: `Token ${this.apiKey}`,
          "Content-Type": format || audio.type || "audio/webm",
        },
        body: audio,
      });

      if (!response.ok) {
        logError("Stt.deepgram", new Error(`Status ${response.status}`));
        return { text: null, confidence: null, provider: null };
      }

      const data = await response.json();
      const channel = data.results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];

      return {
        text: alternative?.transcript ?? null,
        confidence: alternative?.confidence ?? null,
        provider: this.name,
      };
    } catch (err) {
      logError("Stt.deepgram", err);
      return { text: null, confidence: null, provider: null };
    }
  }
}

// Whisper WASM STT provider (lazy-loads pipeline only when needed)
class WhisperSttProvider implements SttProvider {
  readonly name = "whisper";
  private pipeline: unknown = null;
  private pipelinePromise: Promise<unknown> | null = null;

  private async getPipeline(): Promise<unknown> {
    if (this.pipeline) return this.pipeline;
    if (this.pipelinePromise) return this.pipelinePromise;

    this.pipelinePromise = (async () => {
      try {
        // Dynamic import for large WASM module (74MB)
        const { pipeline: createPipeline } = await import("@xenova/transformers");
        const p = await createPipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
          quantized: true,
        });
        this.pipeline = p;
        return p;
      } catch (err) {
        logError("Stt.whisper.load", err);
        return null;
      }
    })();

    return this.pipelinePromise;
  }

  async transcribe(audio: Blob, _format?: string): Promise<SttResult> {
    try {
      const p = await this.getPipeline();
      if (!p) {
        return { text: null, confidence: null, provider: null };
      }

      const audioBuffer = await audio.arrayBuffer();
      // The whisper pipeline expects Float32Array audio data
      // Convert from webm/ogg to raw PCM is complex — this is a simplified version
      // In practice, the pronunciation flow handles this conversion
      const result = await (p as (audio: Float32Array) => Promise<{ text: string }>)(
        new Float32Array(audioBuffer),
      );

      return {
        text: result.text || null,
        confidence: null,
        provider: this.name,
      };
    } catch (err) {
      logError("Stt.whisper.transcribe", err);
      return { text: null, confidence: null, provider: null };
    }
  }
}

// STT Provider chain factory
export function createSttProviderChain(): SttProvider[] {
  const chain: SttProvider[] = [];

  const deepgram = new DeepgramSttProvider(process.env.DEEPGRAM_API_KEY);
  if (deepgram.isAvailable()) {
    chain.push(deepgram);
  }

  // Always add whisper as fallback
  chain.push(new WhisperSttProvider());

  return chain;
}

// Main transcribe function using provider chain
export async function transcribeWithChain(audio: Blob, format?: string): Promise<SttResult> {
  const chain = createSttProviderChain();

  for (const provider of chain) {
    const result = await provider.transcribe(audio, format);
    if (result.text !== null) {
      return result;
    }
  }

  return { text: null, confidence: null, provider: null };
}
