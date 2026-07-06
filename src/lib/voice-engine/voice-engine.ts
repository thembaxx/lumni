import { logError } from "@/lib/shared/logger";
import type {
  TTSOptions,
  TTSProviderConfig,
  TTSProviderName,
  TTSResult,
  VoiceEngineParams,
} from "./types";

const DEFAULT_OPTIONS: TTSOptions = {
  voice: "en_us_guy",
  lang: "en",
  rate: 1,
  pitch: 1,
};

export class VoiceEngine {
  private providers: TTSProviderConfig[] = [];

  constructor() {
    this.providers = this.buildProviderChain();
  }

  private buildProviderChain(): TTSProviderConfig[] {
    const chain: TTSProviderConfig[] = [];

    if (process.env.ELEVENLABS_API_KEY) {
      chain.push({ name: "elevenlabs", synthesize: (t, o) => this.elevenlabsSynthesize(t, o) });
    }

    if (process.env.GOOGLE_TTS_API_KEY) {
      chain.push({
        name: "google-cloud-tts",
        synthesize: (t, o) => this.googleTtsSynthesize(t, o),
      });
    }

    return chain;
  }

  async synthesize(text: string, options: TTSOptions = {}): Promise<TTSResult | null> {
    if (!text || text.trim().length === 0) return null;

    const merged: TTSOptions = { ...DEFAULT_OPTIONS, ...options };

    for (const provider of this.providers) {
      try {
        const result = await provider.synthesize(text, merged);
        if (result) return result;
      } catch (err) {
        logError(`VoiceEngine.${provider.name}`, err);
      }
    }

    return null;
  }

  async resolve(params: VoiceEngineParams): Promise<TTSResult | null> {
    return this.synthesize(params.text, params.options);
  }

  hasServerProvider(): boolean {
    return this.providers.length > 0;
  }

  availableProviders(): TTSProviderName[] {
    return this.providers.map((p) => p.name);
  }

  private async elevenlabsSynthesize(text: string, options: TTSOptions): Promise<TTSResult | null> {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) return null;

    const voiceId = options.voice || "21m00Tcm4TlvDq8ikWAM";
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_monolingual_v1",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    });

    if (!response.ok) {
      logError("VoiceEngine.elevenlabs", new Error(`Status ${response.status}`));
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    const audio = Buffer.from(arrayBuffer).toString("base64");
    return { audio, format: "mp3", provider: "elevenlabs" };
  }

  private async googleTtsSynthesize(text: string, options: TTSOptions): Promise<TTSResult | null> {
    const apiKey = process.env.GOOGLE_TTS_API_KEY;
    if (!apiKey) return null;

    const langCode = options.lang === "af" ? "af-ZA" : options.lang === "zu" ? "zu-ZA" : "en-ZA";
    const name = `${langCode}-Wavenet-A`;

    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: langCode, name },
          audioConfig: { audioEncoding: "MP3" },
        }),
      },
    );

    if (!response.ok) {
      logError("VoiceEngine.googleTts", new Error(`Status ${response.status}`));
      return null;
    }

    const data = await response.json();
    return { audio: data.audioContent, format: "mp3", provider: "google-cloud-tts" };
  }
}

export const voiceEngine = new VoiceEngine();
