"use client";

import { useEffect } from "react";
import { logError } from "@/lib/shared/logger";
import { useExamSessionStore } from "@/store/exam-session";

const EXAM_SESSION_STORAGE_KEY = "exam-session-storage";

export function useExamSessionSync() {
	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleStorage = (e: StorageEvent) => {
			if (e.key === EXAM_SESSION_STORAGE_KEY && e.newValue) {
				try {
					const parsed = JSON.parse(e.newValue);
					if (parsed?.state) {
						useExamSessionStore.setState(parsed.state);
					}
				} catch (e) {
					logError("ExamSessionSync", e);
				}
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);
}
