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

type Listener<T> = (data: T) => void;

class TTSService {
	private synth: SpeechSynthesis | null = null;
	private startListeners = new Set<Listener<void>>();
	private endListeners = new Set<Listener<void>>();
	private errorListeners = new Set<Listener<string>>();

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
			for (const cb of this.errorListeners)
				cb("Speech synthesis not supported");
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
			for (const cb of this.startListeners) cb();
		};

		utterance.onend = () => {
			for (const cb of this.endListeners) cb();
		};

		utterance.onerror = (event) => {
			for (const cb of this.errorListeners) cb(event.error);
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

	onStart(callback: () => void): () => void {
		this.startListeners.add(callback);
		return () => this.startListeners.delete(callback);
	}

	onEnd(callback: () => void): () => void {
		this.endListeners.add(callback);
		return () => this.endListeners.delete(callback);
	}

	onError(callback: (error: string) => void): () => void {
		this.errorListeners.add(callback);
		return () => this.errorListeners.delete(callback);
	}
}

export const ttsService = new TTSService();
