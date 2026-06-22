"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/observability/events";

export function OfflineTracker() {
  useEffect(() => {
    trackEvent("offline_visit", "offline_page");
  }, []);
  return null;
}
