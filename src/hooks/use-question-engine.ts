"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import type {
	GenerationParams,
	GradingResult,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { trackEngineEvent } from "@/lib/utils/engine-analytics";

interface GenerateResult {
	questions: Question[];
	count: number;
	type: string;
}

interface HintResult {
	hint: string;
}

async function generateQuestions(
	params: GenerationParams,
): Promise<GenerateResult> {
	const response = await fetch("/api/engine/generate", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(params),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to generate questions");
	}
	return response.json();
}

async function gradeAnswer(
	question: Question,
	answer: UserAnswer,
): Promise<GradingResult> {
	const response = await fetch("/api/engine/grade", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ question, answer }),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to grade answer");
	}
	return response.json();
}

async function generateHint(question: Question): Promise<HintResult> {
	const response = await fetch("/api/engine/hint", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ question }),
	});
	if (!response.ok) {
		const error = await response.json();
		throw new Error(error.error || "Failed to generate hint");
	}
	return response.json();
}

interface UseQuestionEngineOptions {
	enabled?: boolean;
}

export function useQuestionEngine(
	params?: GenerationParams,
	options?: UseQuestionEngineOptions,
) {
	const query = useQuery({
		queryKey: ["questionEngine", params],
		queryFn: async () => {
			const result = await generateQuestions(params!);
			trackEngineEvent({
				event: "generate",
				subject: params?.subject,
				questionType: params?.questionType
					? Array.isArray(params.questionType)
						? params.questionType.join(",")
						: params.questionType
					: "any",
				count: result.count,
				success: true,
			});
			return result;
		},
		enabled: options?.enabled ?? !!params,
		staleTime: 1000 * 60 * 60,
		retry: 1,
	});

	const gradeMutation = useMutation({
		mutationFn: async ({
			question,
			answer,
		}: {
			question: Question;
			answer: UserAnswer;
		}) => {
			const result = await gradeAnswer(question, answer);
			trackEngineEvent({
				event: "grade",
				subject: question.subject,
				questionType: question.type,
				success: true,
			});
			return result;
		},
	});

	const hintMutation = useMutation({
		mutationFn: async (question: Question) => {
			const result = await generateHint(question);
			trackEngineEvent({
				event: "hint",
				subject: question.subject,
				questionType: question.type,
				success: true,
			});
			return result;
		},
	});

	const generate = useCallback(
		async (generateParams: GenerationParams): Promise<Question[]> => {
			const result = await generateQuestions(generateParams);
			trackEngineEvent({
				event: "generate",
				subject: generateParams.subject,
				questionType: generateParams.questionType
					? Array.isArray(generateParams.questionType)
						? generateParams.questionType.join(",")
						: generateParams.questionType
					: "any",
				count: result.count,
				success: true,
			});
			return result.questions;
		},
		[],
	);

	const grade = useCallback(
		async (question: Question, answer: UserAnswer): Promise<GradingResult> => {
			return gradeMutation.mutateAsync({ question, answer });
		},
		[gradeMutation],
	);

	const hint = useCallback(
		async (question: Question): Promise<string> => {
			const result = await hintMutation.mutateAsync(question);
			return result.hint;
		},
		[hintMutation],
	);

	return {
		questions: query.data?.questions ?? [],
		count: query.data?.count ?? 0,
		isLoading: query.isLoading,
		error: query.error,
		isError: query.isError,
		generate,
		grade,
		hint,
		isGrading: gradeMutation.isPending,
		gradeResult: gradeMutation.data,
		gradeError: gradeMutation.error,
		isGeneratingHint: hintMutation.isPending,
		hintResult: hintMutation.data?.hint,
		hintError: hintMutation.error,
		refetch: query.refetch,
	};
}
