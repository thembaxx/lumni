"use client";

export interface TTSOptions {
	lang?: string;
	rate?: number;
	pitch?: number;
	volume?: number;
}

export interface TTSVoice {
	name: string;
	lang: string;
	localService: boolean;
}

export interface TTSState {
	isSupported: boolean;
	isSpeaking: boolean;
	isPaused: boolean;
	voices: TTSVoice[];
	currentVoice: TTSVoice | null;
}

class TTSService {
	private synth: SpeechSynthesis | null = null;
	private onStartCallback: (() => void) | null = null;
	private onEndCallback: (() => void) | null = null;
	private onErrorCallback: ((error: string) => void) | null = null;

	constructor() {
		if (typeof window !== "undefined" && "speechSynthesis" in window) {
			this.synth = window.speechSynthesis;
		}
	}

	isSupported(): boolean {
		return this.synth !== null;
	}

	getVoices(): TTSVoice[] {
		if (!this.synth) return [];

		const voices = this.synth.getVoices();
		return voices.map((v) => ({
			name: v.name,
			lang: v.lang,
			localService: v.localService,
		}));
	}

	getVoicesForLanguage(lang: string): TTSVoice[] {
		const voices = this.getVoices();
		return voices.filter((v) =>
			v.lang.toLowerCase().startsWith(lang.toLowerCase()),
		);
	}

	async speak(text: string, options: TTSOptions = {}): Promise<void> {
		if (!this.synth) {
			this.onErrorCallback?.("Speech synthesis not supported");
			return;
		}

		this.synth.cancel();

		const utterance = new SpeechSynthesisUtterance(text);
		utterance.lang = options.lang || "en-US";
		utterance.rate = options.rate || 1;
		utterance.pitch = options.pitch || 1;
		utterance.volume = options.volume || 1;

		const voices = this.getVoices();
		const selectedVoice = voices.find((v) =>
			v.lang.toLowerCase().startsWith(utterance.lang.toLowerCase()),
		);
		if (selectedVoice) {
			const speechVoice = this.synth
				.getVoices()
				.find((v) => v.name === selectedVoice.name);
			if (speechVoice) {
				utterance.voice = speechVoice;
			}
		}

		utterance.onstart = () => {
			this.onStartCallback?.();
		};

		utterance.onend = () => {
			this.onEndCallback?.();
		};

		utterance.onerror = (event) => {
			this.onErrorCallback?.(event.error);
		};

		this.synth.speak(utterance);
	}

	pause(): void {
		if (this.synth) {
			this.synth.pause();
		}
	}

	resume(): void {
		if (this.synth) {
			this.synth.resume();
		}
	}

	cancel(): void {
		if (this.synth) {
			this.synth.cancel();
		}
	}

	isSpeaking(): boolean {
		return this.synth?.speaking ?? false;
	}

	isPaused(): boolean {
		return this.synth?.paused ?? false;
	}

	onStart(callback: () => void): void {
		this.onStartCallback = callback;
	}

	onEnd(callback: () => void): void {
		this.onEndCallback = callback;
	}

	onError(callback: (error: string) => void): void {
		this.onErrorCallback = callback;
	}
}

export const ttsService = new TTSService();

export const SUPPORTED_LANGUAGES = [
	{ code: "en-US", name: "English (US)", flag: "🇺🇸" },
	{ code: "en-GB", name: "English (UK)", flag: "🇬🇧" },
	{ code: "af-ZA", name: "Afrikaans", flag: "🇿🇦" },
	{ code: "zu-ZA", name: "Zulu", flag: "🇿🇦" },
	{ code: "xh-XH", name: "Xhosa", flag: "🇿🇦" },
];

export function getLanguageForText(text: string): string {
	const firstChar = text.charCodeAt(0);
	if (firstChar >= 0x0600 && firstChar <= 0x06ff) return "ar-SA";
	if (firstChar >= 0x0400 && firstChar <= 0x04ff) return "ru-RU";
	if (firstChar >= 0x0e00 && firstChar <= 0x0e7f) return "th-TH";
	if (firstChar >= 0x4e00 && firstChar <= 0x9fff) return "zh-CN";
	return "en-US";
}

export interface PronunciationExercise {
	id: string;
	text: string;
	translation: string;
	difficulty: "easy" | "medium" | "hard";
	phoneticHint?: string;
}

export const SAMPLE_EXERCISES: Record<string, PronunciationExercise[]> = {
	en: [
		{
			id: "e1",
			text: "The quick brown fox jumps over the lazy dog.",
			translation: "",
			difficulty: "easy",
		},
		{
			id: "e2",
			text: "She sells seashells by the seashore.",
			translation: "",
			difficulty: "medium",
		},
		{
			id: "e3",
			text: "The rain in Spain stays mainly in the plain.",
			translation: "",
			difficulty: "hard",
		},
	],
	af: [
		{
			id: "a1",
			text: "Goeie more, hoe gaan dit?",
			translation: "Good morning, how are you?",
			difficulty: "easy",
		},
		{
			id: "a2",
			text: "Die son skyn vandag.",
			translation: "The sun is shining today.",
			difficulty: "easy",
		},
		{
			id: "a3",
			text: "Ek is jamskêr by die skool.",
			translation: "I am a teacher at the school.",
			difficulty: "medium",
		},
	],
};

export function getExercisesForLanguage(lang: string): PronunciationExercise[] {
	const langCode = lang.split("-")[0];
	return SAMPLE_EXERCISES[langCode] || SAMPLE_EXERCISES.en;
}
