import { getWhisperService } from "@/lib/audio-engine/whisper-service";

export type ModelState = "idle" | "downloading" | "loaded" | "error";

export function createProgressPoller(
  onProgress: (pct: number) => void,
  onLoaded: () => void,
): () => void {
  const svc = getWhisperService();
  svc.onDownloadProgress(onProgress);
  const id = setInterval(() => {
    const pct = svc.getDownloadProgress();
    onProgress(pct);
    if (pct >= 100 || svc.getLoadState() === "loaded") {
      onLoaded();
      clearInterval(id);
    }
  }, 200);
  return () => clearInterval(id);
}
