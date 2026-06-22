export interface AudioEngineOptions {
  minDuration?: number;
  maxDuration?: number;
}

export interface RecordingResult {
  blob: Blob;
  duration: number;
}

export type PlaybackState = "idle" | "playing" | "paused";
export type PermissionState = "prompt" | "granted" | "denied" | "unsupported";

export interface AudioEngineState {
  isRecording: boolean;
  playbackState: PlaybackState;
  audioBlob: Blob | null;
  duration: number;
  playbackPosition: number;
  totalDuration: number;
  permissionStatus: PermissionState;
  error: string | null;
}
