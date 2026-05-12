"use client";

import { useEffect, useRef } from "react";
import { jobProcessor } from "@/lib/orchestrator/job-processor";

const POLL_INTERVAL_MS = 30_000;

export function useJobProcessor() {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const process = () => {
			jobProcessor.processBatch(5).catch(() => {});
		};

		if (navigator.onLine) {
			process();
		}

		intervalRef.current = setInterval(() => {
			if (navigator.onLine) {
				process();
			}
		}, POLL_INTERVAL_MS);

		const handleOnline = () => {
			process();
		};

		window.addEventListener("online", handleOnline);

		return () => {
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
			}
			window.removeEventListener("online", handleOnline);
		};
	}, []);
}
