"use client";

import { useCallback, useEffect, useRef } from "react";
import {
	clearExamSession,
	getExamSession,
	saveExamSession,
} from "@/lib/db/repositories/exam-session";
import type { ExamSessionSnapshot } from "@/lib/db/schema";
import { useExamSessionStore } from "@/store/exam-session";

const STALE_AGE_MS = 4 * 60 * 60 * 1000;

export function useExamSessionAutoSave(paperId: string | null) {
	const persist = useCallback(() => {
		const state = useExamSessionStore.getState();
		if (!paperId || !state.paperId) return;

		saveExamSession(paperId, {
			answers: state.answers,
			flags: state.flags,
			currentPartId: state.currentPartId,
			timeRemaining: state.timeRemaining,
			startedAt: state.startedAt ?? Date.now(),
			completed: state.completed,
		});
	}, [paperId]);

	const persistRef = useRef(persist);
	persistRef.current = persist;

	useEffect(() => {
		const handleVisibility = () => {
			if (document.visibilityState === "hidden") {
				persistRef.current();
			}
		};
		const handlePageHide = () => persistRef.current();

		document.addEventListener("visibilitychange", handleVisibility);
		window.addEventListener("pagehide", handlePageHide);
		window.addEventListener("beforeunload", handlePageHide);

		const interval = setInterval(() => {
			persistRef.current();
		}, 30_000);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
			window.removeEventListener("pagehide", handlePageHide);
			window.removeEventListener("beforeunload", handlePageHide);
			clearInterval(interval);
		};
	}, []);

	return {
		saveNow: persist,
	};
}

export async function hasSavedSession(
	paperId: string,
): Promise<ExamSessionSnapshot | null> {
	const session = await getExamSession(paperId);
	if (!session) return null;
	if (session.completed) return null;
	if (Date.now() - session.lastSavedAt > STALE_AGE_MS) {
		await clearExamSession(paperId);
		return null;
	}
	return session;
}

export async function clearSavedSession(paperId: string): Promise<void> {
	await clearExamSession(paperId);
}
