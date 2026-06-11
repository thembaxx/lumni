"use client";

import { useEffect } from "react";
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
				} catch {
					console.warn("[ExamSession] Failed to parse cross-tab sync data");
				}
			}
		};

		window.addEventListener("storage", handleStorage);
		return () => window.removeEventListener("storage", handleStorage);
	}, []);
}
