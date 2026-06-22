import { create } from "zustand";

interface VoiceRecorderState {
  isRecording: boolean;
  isPlaying: boolean;
  audioBlob: Blob | null;
  duration: number;
  playbackPosition: number;
  isSending: boolean;
  sendSuccess: boolean;

  setIsRecording: (recording: boolean) => void;
  setIsPlaying: (playing: boolean) => void;
  setAudioBlob: (blob: Blob | null) => void;
  setDuration: (duration: number) => void;
  setPlaybackPosition: (position: number) => void;
  setIsSending: (sending: boolean) => void;
  setSendSuccess: (success: boolean) => void;
  reset: () => void;
}

export const useVoiceRecorderStore = create<VoiceRecorderState>((set) => ({
  isRecording: false,
  isPlaying: false,
  audioBlob: null,
  duration: 0,
  playbackPosition: 0,
  isSending: false,
  sendSuccess: false,

  setIsRecording: (isRecording) => set({ isRecording }),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setAudioBlob: (audioBlob) => set({ audioBlob }),
  setDuration: (duration) => set({ duration }),
  setPlaybackPosition: (playbackPosition) => set({ playbackPosition }),
  setIsSending: (isSending) => set({ isSending }),
  setSendSuccess: (sendSuccess) => set({ sendSuccess }),

  reset: () =>
    set({
      isRecording: false,
      isPlaying: false,
      audioBlob: null,
      duration: 0,
      playbackPosition: 0,
      isSending: false,
      sendSuccess: false,
    }),
}));
