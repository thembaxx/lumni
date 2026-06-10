"use client";

import { useEffect, useRef } from "react";
import { useExamSessionStore } from "@/store/exam-session";

function ExamTimer() {
	const tick = useExamSessionStore((s) => s.tick);
	const completed = useExamSessionStore((s) => s.completed);
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		if (!completed) {
			intervalRef.current = setInterval(tick, 1000);
		}
		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [tick, completed]);

	return null;
}
