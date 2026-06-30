"use client";

import { useCallback } from "react";
import { logError } from "@/lib/shared/logger";
import { jobProcessor } from "@/lib/orchestrator/job-processor";
import { useInterval } from "./use-interval";
import { useOnlineStatus } from "./useOnlineStatus";

const POLL_INTERVAL_MS = 30_000;

export function useJobProcessor() {
  const { isOnline } = useOnlineStatus();

  const process = useCallback(() => {
    jobProcessor.processBatch(5).catch((e) => logError("UseJobProcessor.Batch", e));
  }, []);

  useInterval(process, isOnline ? POLL_INTERVAL_MS : null);
}
