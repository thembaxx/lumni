import type { AudioInput, STTOptions, STTProvider, STTResult } from "../types";

function getSpeechRecognition(): new () => SpeechRecognition {
  const Ctor =
    typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
  if (!Ctor) throw new Error("Browser SpeechRecognition is not available");
  return Ctor;
}

export function createBrowserNativeProvider(): STTProvider {
  return {
    name: "browser-native",
    capabilities: {
      streaming: false,
      languages: ["en-ZA", "en-US"],
      offline: false,
      costPerMinute: 0,
    },
    transcribe: async (_audio: AudioInput, options?: STTOptions): Promise<STTResult> => {
      const SpeechRecognition = getSpeechRecognition();
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = options?.language ?? "en-ZA";

      return new Promise((resolve, reject) => {
        const start = performance.now();

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          const result = event.results[0];
          if (!result) {
            resolve({
              text: "",
              confidence: 0,
              duration: (performance.now() - start) / 1000,
              provider: "browser-native",
            });
            return;
          }

          const transcript = result[0]?.transcript ?? "";
          const confidence = result[0]?.confidence ?? 0;

          const alternatives: { text: string; confidence: number }[] = [];
          for (let i = 1; i < result.length; i++) {
            alternatives.push({
              text: result[i]?.transcript ?? "",
              confidence: result[i]?.confidence ?? 0,
            });
          }

          resolve({
            text: transcript,
            confidence,
            alternatives: alternatives.length > 0 ? alternatives : undefined,
            duration: (performance.now() - start) / 1000,
            provider: "browser-native",
          });
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          reject(new Error(`SpeechRecognition error: ${event.error}`));
        };

        recognition.onend = () => {
          resolve({
            text: "",
            confidence: 0,
            duration: (performance.now() - start) / 1000,
            provider: "browser-native",
          });
        };

        recognition.start();
      });
    },
  };
}
