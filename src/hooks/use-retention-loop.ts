"use client";

import { useCallback, useEffect, useState } from "react";
import type { RetentionRecurrence } from "@/lib/db/schema";
import { retentionService } from "@/lib/retention-loop";

export function useRetentionLoop(userId?: string) {
	const [candidates, setCandidates] = useState<RetentionRecurrence[]>([]);
	const [stats, setStats] = useState({
		totalScheduled: 0,
		totalCompleted: 0,
		totalCorrect: 0,
		accuracy: 0,
		pendingCount: 0,
	});

	const refreshStats = useCallback(async () => {
		if (!userId) return;
		const s = await retentionService.getRecurrenceStats(userId);
		setStats(s);
	}, [userId]);

	useEffect(() => {
		if (!userId) return;
		retentionService.getRecurrenceStats(userId).then((s) => setStats(s));
	}, [userId]);

	const scheduleRetention = useCallback(
		async (count = 3) => {
			if (!userId) return [];
			const result = await retentionService.getRecurrenceCandidates(
				userId,
				count,
			);
			if (result.length > 0) {
				setCandidates((prev) => [...prev, ...result]);
				refreshStats();
			}
			return result;
		},
		[userId, refreshStats],
	);

	const recordRecurrence = useCallback(
		async (questionId: string, isCorrect: boolean) => {
			if (!userId) return;
			await retentionService.markRecurrence(questionId, userId, isCorrect);
			setCandidates((prev) => prev.filter((c) => c.questionId !== questionId));
			refreshStats();
		},
		[userId, refreshStats],
	);

	return {
		candidates,
		stats,
		scheduleRetention,
		recordRecurrence,
		refreshStats,
	};
}
