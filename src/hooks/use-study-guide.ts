"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { budgetFetch } from "@/lib/shared/api-fetch";
import type { StudyGuide } from "@/lib/study-guide/types";

interface UseStudyGuideParams {
	subject: string;
	topic: string;
}

export function useStudyGuide() {
	const queryClient = useQueryClient();
	return useMutation<StudyGuide, Error, UseStudyGuideParams>({
		mutationFn: ({ subject, topic }) =>
			budgetFetch<StudyGuide>(
				"/api/engine/study-guide",
				{
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subject, topic }),
				},
				"GenerateStudyGuide",
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["study-guide"] });
		},
	});
}
