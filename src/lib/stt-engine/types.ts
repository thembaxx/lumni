export interface AudioInput {
  blob: Blob | Float32Array;
  sampleRate: number;
  channels: number;
}

export interface STTOptions {
  language?: string;
  model?: "nova-2" | "whisper-large-v3";
  punctuate?: boolean;
  diarize?: boolean;
  maxAlternatives?: number;
}

export interface STTResult {
  text: string;
  confidence: number;
  alternatives?: { text: string; confidence: number }[];
  words?: { word: string; start: number; end: number; confidence: number }[];
  duration: number;
  provider: string;
}

export interface STTProvider {
  readonly name: string;
  readonly capabilities: {
    streaming: boolean;
    languages: string[];
    offline: boolean;
    costPerMinute: number;
  };
  transcribe(audio: AudioInput, options?: STTOptions): Promise<STTResult>;
}

export interface STTUsageReport {
  totalMinutes: number;
  totalCost: number;
  byProvider: { provider: string; minutes: number; cost: number }[];
  byDate: { date: string; minutes: number; cost: number }[];
}

export interface STTCacheEntry {
  key: string;
  result: string;
  expiresAt: number;
}

export interface STTUsageEntry {
  id?: number;
  date: string;
  provider: string;
  minutes: number;
  cost: number;
}
