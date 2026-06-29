import type { AudioInput, STTOptions, STTProvider, STTResult } from "../types";

export function createWhisperWasmProvider(): STTProvider {
  return {
    name: "whisper-wasm",
    capabilities: {
      streaming: false,
      languages: ["en", "af", "zu", "xh", "st", "tn", "nso", "ss", "ve", "ts"],
      offline: true,
      costPerMinute: 0,
    },
    transcribe: async (_audio: AudioInput, _options?: STTOptions): Promise<STTResult> => {
      throw new Error(
        "Whisper WASM is not yet implemented. Install @xenova/transformers and load the model.",
      );
    },
  };
}
