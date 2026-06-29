import type { AudioInput, STTOptions, STTProvider, STTResult } from "../types";

const DEEPGRAM_URL = "https://api.deepgram.com/v1/listen";

export function createDeepgramProvider(): STTProvider {
  return {
    name: "deepgram",
    capabilities: {
      streaming: false,
      languages: ["en-ZA", "af", "zu", "xh", "st", "tn"],
      offline: false,
      costPerMinute: 0.0043,
    },
    transcribe: async (audio: AudioInput, options?: STTOptions): Promise<STTResult> => {
      const apiKey = process.env.DEEPGRAM_API_KEY;
      if (!apiKey) {
        throw new Error("DEEPGRAM_API_KEY is not configured");
      }

      let body: BodyInit;
      let format: string;

      if (audio.blob instanceof Blob) {
        body = audio.blob;
        format = audio.blob.type || "audio/webm";
      } else {
        body = new Float32Array(audio.blob).buffer;
        format = "audio/l16;rate=16000";
      }

      const params = new URLSearchParams();
      if (options?.language) params.set("language", options.language);
      if (options?.model) params.set("model", options.model);
      if (options?.punctuate !== false) params.set("punctuate", "true");
      if (options?.diarize) params.set("diarize", "true");
      if (options?.maxAlternatives) params.set("alternatives", String(options.maxAlternatives));

      const url = `${DEEPGRAM_URL}?${params.toString()}`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": format,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Deepgram API error: ${response.status}`);
      }

      const data = await response.json();
      const channel = data.results?.channels?.[0];
      const alternative = channel?.alternatives?.[0];
      const duration = data.metadata?.duration ?? 0;

      const words = alternative?.words?.map(
        (w: { word: string; start: number; end: number; confidence: number }) => ({
          word: w.word,
          start: w.start,
          end: w.end,
          confidence: w.confidence,
        }),
      );

      const alternatives = channel?.alternatives
        ?.slice(1)
        ?.map((alt: { transcript: string; confidence: number }) => ({
          text: alt.transcript,
          confidence: alt.confidence,
        }));

      return {
        text: alternative?.transcript ?? "",
        confidence: alternative?.confidence ?? 0,
        alternatives,
        words,
        duration,
        provider: "deepgram",
      };
    },
  };
}
