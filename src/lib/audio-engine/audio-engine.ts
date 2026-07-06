import { logError } from "@/lib/shared/logger";
import type {
  AudioEngineOptions,
  AudioEngineState,
  PermissionState,
  PlaybackState,
  RecordingResult,
} from "./types";

class AudioEngine {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioElement: HTMLAudioElement | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private permissionStatus: PermissionState = "prompt";
  private _isRecording = false;
  private _duration = 0;
  private _playbackPosition = 0;
  private _playbackState: PlaybackState = "idle";
  private _audioBlob: Blob | null = null;
  private _error: string | null = null;
  private _totalDuration = 0;
  private onStateChange: (() => void) | null = null;

  private options: Required<AudioEngineOptions>;

  constructor(options: AudioEngineOptions = {}) {
    this.options = {
      minDuration: options.minDuration ?? 1,
      maxDuration: options.maxDuration ?? 300,
    };
  }

  getState(): AudioEngineState {
    return {
      isRecording: this._isRecording,
      playbackState: this._playbackState,
      audioBlob: this._audioBlob,
      duration: this._duration,
      playbackPosition: this._playbackPosition,
      totalDuration: this._totalDuration,
      permissionStatus: this.permissionStatus,
      error: this._error,
    };
  }

  subscribe(cb: () => void): () => void {
    this.onStateChange = cb;
    return () => {
      this.onStateChange = null;
    };
  }

  private notify(): void {
    this.onStateChange?.();
  }

  isSupported(): boolean {
    return !!(typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia);
  }

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      this.permissionStatus = "unsupported";
      this._error = "Audio recording not supported";
      this.notify();
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      for (const t of stream.getTracks()) t.stop();
      this.permissionStatus = "granted";
      this._error = null;
      this.notify();
      return true;
    } catch (err) {
      logError("AudioEngineRequestPermission", err);
      const error = err instanceof Error ? err : undefined;
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        this.permissionStatus = "denied";
        this._error = "Microphone access denied";
      } else {
        this.permissionStatus = "denied";
        this._error = `Microphone access failed: ${error?.message ?? "Unknown error"}`;
      }
      this.notify();
      return false;
    }
  }

  async startRecording(): Promise<void> {
    if (this._isRecording) return;
    if (!this.isSupported()) {
      this._error = "Audio recording not supported";
      this.notify();
      return;
    }

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.permissionStatus = "granted";
      this._error = null;

      const recorder = new MediaRecorder(stream);
      this.mediaRecorder = recorder;
      this.audioChunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: "audio/webm" });
        this._audioBlob = blob;
        this._totalDuration = this._duration;
        for (const t of stream!.getTracks()) t.stop();
        this.notify();
      };

      recorder.start(100);
      this._isRecording = true;
      this._duration = 0;
      this._audioBlob = null;

      this.timer = setInterval(() => {
        this._duration += 1;
        if (this._duration >= this.options.maxDuration) {
          this.stopRecording();
          this._error = `Maximum recording time (${this.options.maxDuration}s) reached.`;
        }
        this.notify();
      }, 1000);

      this.notify();
    } catch (err) {
      if (stream) {
        for (const t of stream.getTracks()) t.stop();
      }
      logError("AudioEngineStartRecording", err);
      const error = err instanceof Error ? err : undefined;
      if (error?.name === "NotAllowedError" || error?.name === "PermissionDeniedError") {
        this.permissionStatus = "denied";
        this._error = "Microphone access denied";
      } else {
        this._error = `Failed to start recording: ${error?.message ?? "Unknown error"}`;
      }
      this.notify();
    }
  }

  stopRecording(): void {
    if (!this._isRecording) return;

    if (this.mediaRecorder && this.mediaRecorder.state === "recording") {
      this.mediaRecorder.stop();
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this._isRecording = false;
    this.notify();
  }

  resetRecording(): void {
    this.stopPlayback();
    this._audioBlob = null;
    this._duration = 0;
    this._playbackPosition = 0;
    this._totalDuration = 0;
    this._error = null;
    this.notify();
  }

  getRecordingResult(): RecordingResult | null {
    if (!this._audioBlob) return null;
    return { blob: this._audioBlob, duration: this._duration };
  }

  async startPlayback(): Promise<void> {
    if (!this._audioBlob) return;

    if (!this.audioElement) {
      this.audioElement = new Audio(URL.createObjectURL(this._audioBlob));
      this.audioElement.onended = () => {
        this._playbackState = "idle";
        this._playbackPosition = 0;
        this.notify();
      };
      this.audioElement.ontimeupdate = () => {
        this._playbackPosition = this.audioElement?.currentTime || 0;
        this.notify();
      };
    }

    await this.audioElement.play();
    this._playbackState = "playing";
    this.notify();
  }

  pausePlayback(): void {
    this.audioElement?.pause();
    this._playbackState = "paused";
    this.notify();
  }

  stopPlayback(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this._playbackState = "idle";
    this._playbackPosition = 0;
    this.notify();
  }

  togglePlayback(): Promise<void> | void {
    if (this._playbackState === "playing") {
      this.pausePlayback();
    } else {
      return this.startPlayback();
    }
  }

  destroy(): void {
    this.stopRecording();
    this.stopPlayback();
    if (this.audioElement) {
      this.audioElement.src = "";
      this.audioElement = null;
    }
  }
}

export const audioEngine = new AudioEngine();
