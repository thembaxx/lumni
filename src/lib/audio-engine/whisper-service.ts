"use client";

import { assessPhonemes } from "@/lib/audio-engine/phoneme-service";
import { logError } from "@/lib/shared/logger";

type WhisperModelSize = "tiny" | "base" | "small" | "medium" | "large";

interface WhisperConfig {
	modelSize: WhisperModelSize;
	language?: string;
}

interface WhisperResult {
	text: string;
	segments: { start: number; end: number; text: string }[];
	confidence: number;
}

export interface PhonemeDetail {
	expected: string;
	actual: string;
	correct: boolean;
	position: number;
}

interface PronunciationAssessment {
	overallScore: number;
	wordScores: { word: string; accuracy: number; isCorrect: boolean }[];
	fluencyScore: number;
	phonemeAccuracy: number;
	phonemeDetails: PhonemeDetail[];
}

type LoadState = "idle" | "loading" | "loaded" | "error";

const MODEL_URLS: Record<WhisperModelSize, { url: string; sizeMB: number }> = {
	tiny: {
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.bin",
		sizeMB: 74,
	},
	base: {
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin",
		sizeMB: 141,
	},
	small: {
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-small.bin",
		sizeMB: 461,
	},
	medium: {
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-medium.bin",
		sizeMB: 1.42 * 1024,
	},
	large: {
		url: "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3.bin",
		sizeMB: 2.88 * 1024,
	},
};

const CACHE_NAME = "whisper-model";

export class WhisperService {
	private state: LoadState = "idle";
	private worker: Worker | null = null;
	private config: WhisperConfig;
	private _downloadProgress = 0;
	private onProgress: ((pct: number) => void) | null = null;

	constructor(config: WhisperConfig = { modelSize: "tiny" }) {
		this.config = config;
	}

	getLoadState(): LoadState {
		return this.state;
	}

	getDownloadProgress(): number {
		return this._downloadProgress;
	}

	onDownloadProgress(cb: (pct: number) => void): void {
		this.onProgress = cb;
	}

	async loadModel(): Promise<boolean> {
		if (this.state === "loaded") return true;
		this.state = "loading";
		this._downloadProgress = 0;

		try {
			const modelInfo = MODEL_URLS[this.config.modelSize];
			const modelBuffer = await this.downloadModelWithProgress(modelInfo.url);

			this.worker = new Worker(
				new URL("./whisper.worker.ts", import.meta.url),
				{ type: "module" },
			);

			await new Promise<void>((resolve, reject) => {
				if (!this.worker) return reject(new Error("Worker not created"));

				this.worker.onmessage = (e: MessageEvent) => {
					if (e.data.type === "loaded") {
						resolve();
					} else if (e.data.type === "error") {
						reject(new Error(e.data.error));
					}
				};

				this.worker.onerror = (err) => reject(err);

				this.worker.postMessage({
					type: "load",
					model: modelBuffer,
					language: this.config.language,
				});
			});

			this.state = "loaded";
			this._downloadProgress = 100;
			return true;
		} catch (err) {
			this.state = "error";
			logError("WhisperService.loadModel", err);
			return false;
		}
	}

	async transcribe(
		audioBlob: Blob,
		language?: string,
	): Promise<WhisperResult | null> {
		if (this.state !== "loaded" || !this.worker) {
			const loaded = await this.loadModel();
			if (!loaded) return null;
		}

		return new Promise((resolve) => {
			if (!this.worker) return resolve(null);

			const handler = (e: MessageEvent) => {
				if (e.data.type === "result") {
					this.worker?.removeEventListener("message", handler);
					resolve(e.data.result as WhisperResult);
				} else if (e.data.type === "error") {
					this.worker?.removeEventListener("message", handler);
					resolve(null);
				}
			};

			this.worker.addEventListener("message", handler);
			this.worker.postMessage({
				type: "transcribe",
				audio: audioBlob,
				language,
			});
		});
	}

	assessPronunciation(
		studentText: string,
		expectedText: string,
	): PronunciationAssessment {
		const studentWords = studentText.toLowerCase().split(/\s+/);
		const expectedWords = expectedText.toLowerCase().split(/\s+/);

		const wordScores = expectedWords.map((word, i) => {
			const studentWord = studentWords[i] || "";
			const isCorrect = studentWord === word;
			const distance = levenshteinDistance(studentWord, word);
			const maxLen = Math.max(studentWord.length, word.length);
			const accuracy = maxLen > 0 ? 1 - distance / maxLen : 0;
			return { word, accuracy, isCorrect };
		});

		const correctCount = wordScores.filter((w) => w.isCorrect).length;
		const overallScore =
			wordScores.length > 0
				? Math.round((correctCount / wordScores.length) * 100)
				: 0;

		const { phonemeAccuracy, phonemeDetails } = assessPhonemes(
			studentText,
			expectedText,
		);

		return {
			overallScore,
			wordScores,
			fluencyScore: Math.round(
				(1 -
					Math.abs(studentWords.length - expectedWords.length) /
						Math.max(expectedWords.length, 1)) *
					100,
			),
			phonemeAccuracy,
			phonemeDetails,
		};
	}

	unloadModel(): void {
		if (this.worker) {
			this.worker.terminate();
			this.worker = null;
		}
		this.state = "idle";
		this._downloadProgress = 0;
	}

	private async downloadModelWithProgress(
		url: string,
	): Promise<ArrayBuffer | null> {
		try {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match(url);
			if (cached) {
				return cached.arrayBuffer();
			}

			const response = await fetch(url);
			if (!response.ok) return null;

			const reader = response.body?.getReader();
			if (!reader) return response.arrayBuffer();

			const contentLength = Number(response.headers.get("Content-Length")) || 0;
			const chunks: Uint8Array[] = [];
			let received = 0;

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;
				chunks.push(value);
				received += value.length;
				if (contentLength > 0) {
					this._downloadProgress = Math.round((received / contentLength) * 100);
					this.onProgress?.(this._downloadProgress);
				}
			}

			const combined = new Uint8Array(received);
			let offset = 0;
			for (const chunk of chunks) {
				combined.set(chunk, offset);
				offset += chunk.length;
			}

			const buffer = combined.buffer as ArrayBuffer;
			const cacheClone = new Response(combined);
			void cache.put(url, cacheClone);

			return buffer;
		} catch {
			return null;
		}
	}
}

function levenshteinDistance(a: string, b: string): number {
	const matrix: number[][] = [];
	for (let i = 0; i <= b.length; i++) matrix[i] = [i];
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j;
	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			const cost = a[j - 1] === b[i - 1] ? 0 : 1;
			matrix[i][j] = Math.min(
				matrix[i - 1][j] + 1,
				matrix[i][j - 1] + 1,
				matrix[i - 1][j - 1] + cost,
			);
		}
	}
	return matrix[b.length][a.length];
}

let _instance: WhisperService | null = null;

export function getWhisperService(config?: WhisperConfig): WhisperService {
	if (!_instance) {
		_instance = new WhisperService(config);
	}
	return _instance;
}
