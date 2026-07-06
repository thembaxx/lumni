export type TTSProviderName = "elevenlabs" | "google-cloud-tts" | "browser";

export interface TTSOptions {
  voice?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
}

export interface TTSResult {
  audio: string;
  format: "mp3" | "wav";
  provider: TTSProviderName;
  duration?: number;
}

export interface VoiceEngineParams {
  text: string;
  options?: TTSOptions;
}

export interface TTSProviderConfig {
  name: TTSProviderName;
  synthesize(text: string, options: TTSOptions): Promise<TTSResult | null>;
}

export interface TTSState {
  isSpeaking: boolean;
  isPaused: boolean;
  currentText: string | null;
  error: string | null;
}
