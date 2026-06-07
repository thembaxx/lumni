"use client";

import { useMutation } from "@tanstack/react-query";
import type { StudyGuide } from "@/lib/study-guide/types";

interface UseStudyGuideParams {
	subject: string;
	topic: string;
}

export function useStudyGuide() {
	return useMutation<StudyGuide, Error, UseStudyGuideParams>({
		mutationFn: async ({ subject, topic }) => {
			const res = await fetch("/api/engine/study-guide", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ subject, topic }),
			});
			if (!res.ok) {
				const err = await res.json().catch(() => ({}));
				throw new Error(err.error || "Failed to generate study guide");
			}
			return res.json();
		},
	});
}
