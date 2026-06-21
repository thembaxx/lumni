"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import type {
	GenerationParams,
	GradingResult,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { budgetFetch } from "@/lib/shared/api-fetch";

interface GenerateResult {
	questions: Question[];
	count: number;
	type: string;
	sources?: { url: string; title: string }[];
}

interface HintResult {
	hint: string;
}

function generateQuestions(params: GenerationParams): Promise<GenerateResult> {
	return budgetFetch<GenerateResult>(
		"/api/engine/generate",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
		},
		"GenerateQuestions",
	);
}

function gradeAnswer(
	question: Question,
	answer: UserAnswer,
): Promise<GradingResult> {
	return budgetFetch<GradingResult>(
		"/api/engine/grade",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question, answer }),
		},
		"GradeAnswer",
	);
}

function generateHint(question: Question): Promise<HintResult> {
	return budgetFetch<HintResult>(
		"/api/engine/hint",
		{
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question }),
		},
		"GenerateHint",
	);
}

interface UseQuestionEngineOptions {
	enabled?: boolean;
}

export function useQuestionEngine(
	params?: GenerationParams,
	options?: UseQuestionEngineOptions,
) {
	const queryClient = useQueryClient();
	const queryKey = useMemo(
		() => ["questionEngine", params ? JSON.stringify(params) : undefined],
		[params],
	);

	const {
		data: queryData,
		isLoading,
		isFetching,
		error,
		isError,
		refetch,
	} = useQuery({
		queryKey,
		queryFn: () => generateQuestions(params as GenerationParams),
		enabled: options?.enabled ?? !!params,
		staleTime: 1000 * 60 * 60,
		retry: 1,
	});

	const gradeMutation = useMutation({
		mutationFn: ({
			question,
			answer,
		}: {
			question: Question;
			answer: UserAnswer;
		}) => gradeAnswer(question, answer),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] }),
	});

	const hintMutation = useMutation({
		mutationFn: (question: Question) => generateHint(question),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] }),
	});

	const generateMutation = useMutation({
		mutationFn: (p: GenerationParams) => generateQuestions(p),
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] }),
	});

	const generate = useCallback(
		async (p: GenerationParams): Promise<Question[]> => {
			const result = await generateMutation.mutateAsync(p);
			if (params) {
				queryClient.invalidateQueries({
					queryKey: ["questionEngine", JSON.stringify(params)],
				});
			}
			return result.questions;
		},
		[generateMutation, queryClient, params],
	);

	const grade = useCallback(
		(question: Question, answer: UserAnswer) =>
			gradeMutation.mutateAsync({ question, answer }),
		[gradeMutation],
	);

	const hint = useCallback(
		async (question: Question): Promise<string> => {
			const result = await hintMutation.mutateAsync(question);
			return result.hint;
		},
		[hintMutation],
	);

	const questions = useMemo(
		() => queryData?.questions ?? [],
		[queryData?.questions],
	);

	return {
		questions,
		count: queryData?.count ?? 0,
		sources: queryData?.sources ?? [],
		isLoading,
		isFetching,
		error,
		isError,
		generate,
		grade,
		hint,
		isGenerating: generateMutation.isPending,
		isGrading: gradeMutation.isPending,
		gradeResult: gradeMutation.data,
		gradeError: gradeMutation.error,
		isGeneratingHint: hintMutation.isPending,
		hintResult: hintMutation.data?.hint,
		hintError: hintMutation.error,
		refetch,
	};
}
