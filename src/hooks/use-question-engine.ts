"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import type {
	GenerationParams,
	GradingResult,
	Question,
	UserAnswer,
} from "@/lib/question-engine/types";
import { apiFetch, showBudgetToast } from "@/lib/shared/api-fetch";

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
	try {
		return await apiFetch<GenerateResult>("/api/engine/generate", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(params),
		});
	} catch (error) {
		showBudgetToast(error);
		throw error;
	}
}

async function gradeAnswer(
	question: Question,
	answer: UserAnswer,
): Promise<GradingResult> {
	try {
		return await apiFetch<GradingResult>("/api/engine/grade", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question, answer }),
		});
	} catch (error) {
		showBudgetToast(error);
		throw error;
	}
}

async function generateHint(question: Question): Promise<HintResult> {
	try {
		return await apiFetch<HintResult>("/api/engine/hint", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ question }),
		});
	} catch (error) {
		showBudgetToast(error);
		throw error;
	}
}

interface UseQuestionEngineOptions {
	enabled?: boolean;
}

export function useQuestionEngine(
	params?: GenerationParams,
	options?: UseQuestionEngineOptions,
) {
	const queryClient = useQueryClient();
	const [generatedQuestions, setGeneratedQuestions] = useState<
		Question[] | null
	>(null);

	const query = useQuery({
		queryKey: ["questionEngine", params ? JSON.stringify(params) : undefined],
		queryFn: async () => {
			const result = await generateQuestions(params as GenerationParams);
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
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] });
		},
	});

	const hintMutation = useMutation({
		mutationFn: async (question: Question) => {
			const result = await generateHint(question);
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] });
		},
	});

	const generateMutation = useMutation({
		mutationFn: async (generateParams: GenerationParams) => {
			const result = await generateQuestions(generateParams);
			return result;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["questionEngine"] });
		},
	});

	const generate = useCallback(
		async (generateParams: GenerationParams): Promise<Question[]> => {
			setGeneratedQuestions(null);
			const result = await generateMutation.mutateAsync(generateParams);
			setGeneratedQuestions(result.questions);
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

	const questions = useMemo(
		() => generatedQuestions ?? query.data?.questions ?? [],
		[generatedQuestions, query.data?.questions],
	);

	return {
		questions,
		count: query.data?.count ?? 0,
		isLoading: query.isLoading,
		error: query.error,
		isError: query.isError,
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
		refetch: query.refetch,
	};
}
