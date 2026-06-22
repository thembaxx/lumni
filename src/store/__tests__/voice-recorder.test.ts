import { beforeEach, describe, expect, test } from "vitest";
import { useVoiceRecorderStore } from "../voice-recorder";

beforeEach(() => {
  useVoiceRecorderStore.getState().reset();
});

describe("useVoiceRecorderStore", () => {
  test("initial state has defaults", () => {
    const state = useVoiceRecorderStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.isPlaying).toBe(false);
    expect(state.audioBlob).toBeNull();
    expect(state.duration).toBe(0);
    expect(state.playbackPosition).toBe(0);
    expect(state.isSending).toBe(false);
    expect(state.sendSuccess).toBe(false);
  });

  test("setIsRecording updates recording state", () => {
    useVoiceRecorderStore.getState().setIsRecording(true);
    expect(useVoiceRecorderStore.getState().isRecording).toBe(true);
  });

  test("setIsPlaying updates playing state", () => {
    useVoiceRecorderStore.getState().setIsPlaying(true);
    expect(useVoiceRecorderStore.getState().isPlaying).toBe(true);
  });

  test("setAudioBlob sets blob", () => {
    const blob = new Blob(["test"], { type: "audio/webm" });
    useVoiceRecorderStore.getState().setAudioBlob(blob);
    expect(useVoiceRecorderStore.getState().audioBlob).toBe(blob);
  });

  test("setDuration sets duration", () => {
    useVoiceRecorderStore.getState().setDuration(120);
    expect(useVoiceRecorderStore.getState().duration).toBe(120);
  });

  test("reset clears all fields", () => {
    useVoiceRecorderStore.getState().setIsRecording(true);
    useVoiceRecorderStore.getState().setIsPlaying(true);
    useVoiceRecorderStore.getState().setDuration(60);
    useVoiceRecorderStore.getState().setSendSuccess(true);
    useVoiceRecorderStore.getState().reset();
    const state = useVoiceRecorderStore.getState();
    expect(state.isRecording).toBe(false);
    expect(state.isPlaying).toBe(false);
    expect(state.audioBlob).toBeNull();
    expect(state.duration).toBe(0);
    expect(state.sendSuccess).toBe(false);
  });
});
