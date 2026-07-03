import { logError } from "@/lib/shared/logger";
import type { AudioInput, STTOptions, STTProvider, STTResult } from "../types";

let pipelineInstance: unknown = null;
let loadPromise: Promise<void> | null = null;

async function loadPipeline() {
  if (pipelineInstance) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const { pipeline } = await import("@xenova/transformers");
      pipelineInstance = await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
        quantized: true,
      });
    } catch (err) {
      loadPromise = null;
      throw err;
    }
  })();

  return loadPromise;
}

function blobToFloat32Array(blob: Blob): Promise<Float32Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const arrayBuffer = reader.result as ArrayBuffer;
      const decoded = new Float32Array(arrayBuffer.byteLength / 4);
      const view = new DataView(arrayBuffer);
      for (let i = 0; i < decoded.length; i++) {
        decoded[i] = view.getFloat32(i * 4, true);
      }
      resolve(decoded);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

async function toAudioBuffer(input: AudioInput): Promise<Float32Array> {
  if (input.blob instanceof Float32Array) return input.blob;
  return blobToFloat32Array(input.blob);
}

export function createWhisperWasmProvider(): STTProvider {
  return {
    name: "whisper-wasm",
    capabilities: {
      streaming: false,
      languages: ["en", "af", "zu", "xh", "st", "tn", "nso", "ss", "ve", "ts"],
      offline: true,
      costPerMinute: 0,
    },
    transcribe: async (audio: AudioInput, options?: STTOptions): Promise<STTResult> => {
      const start = performance.now();

      try {
        await loadPipeline();

        const audioBuffer = await toAudioBuffer(audio);

        const pipe = pipelineInstance as {
          (
            input: Float32Array,
            opts?: Record<string, unknown>,
          ): Promise<{
            text: string;
            chunks?: { text: string; timestamp: number[] }[];
          }>;
        };

        const result = await pipe(audioBuffer, {
          language: options?.language ?? "en",
          task: "transcribe",
          return_timestamps: true,
        });

        const duration = (performance.now() - start) / 1000;
        const words = result.chunks?.map((c) => ({
          word: c.text.trim(),
          start: c.timestamp[0] ?? 0,
          end: c.timestamp[1] ?? 0,
          confidence: 1,
        }));

        return {
          text: result.text.trim(),
          confidence: 0.85,
          words,
          duration,
          provider: "whisper-wasm",
        };
      } catch (err) {
        logError("WhisperWasmProvider.transcribe", err);
        const duration = (performance.now() - start) / 1000;
        return {
          text: "",
          confidence: 0,
          duration,
          provider: "whisper-wasm",
        };
      }
    },
  };
}
