"use client";

import { useEffect } from "react";
import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import * as Sentry from "@sentry/nextjs";

function sendToAnalytics(metric: { name: string; id: string; value: number; rating: string }) {
  Sentry.captureEvent({
    event_id: metric.id,
    message: metric.name,
    extra: {
      value: metric.value,
      rating: metric.rating,
      metric: metric.name,
    },
    level: "info",
    tags: { web_vital: metric.name, rating: metric.rating },
  });
}

export function WebVitals() {
  useEffect(() => {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    onINP(sendToAnalytics);
  }, []);

  return null;
}
