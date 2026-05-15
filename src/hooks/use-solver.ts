"use client";

import { useMutation } from "@tanstack/react-query";

interface SolverResult {
	solution: string;
	steps: string[];
	provider: string;
}

interface FollowUpResult {
	answer: string;
	provider: string;
}

interface SolveParams {
	question: string;
	subject?: string;
}

interface FollowUpParams {
	question: string;
	context: { role: "user" | "assistant"; content: string }[];
	subject?: string;
}

async function solveProblem({
	question,
	subject,
}: SolveParams): Promise<SolverResult> {
	const response = await fetch("/api/solve", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			question,
			subject: subject || undefined,
			mode: "solve",
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Failed to solve the problem");
	}

	return response.json();
}

async function sendFollowUp({
	question,
	context,
	subject,
}: FollowUpParams): Promise<FollowUpResult> {
	const response = await fetch("/api/solve", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			question,
			subject: subject || undefined,
			mode: "solve",
			context,
			followUp: true,
		}),
	});

	if (!response.ok) {
		const error = await response.json().catch(() => ({}));
		throw new Error(error.error || "Failed to get answer");
	}

	return response.json();
}

interface UseSolverOptions {
	onSuccess?: (result: SolverResult) => void;
	onError?: (error: Error) => void;
}

export function useSolver(options?: UseSolverOptions) {
	const solve = useMutation({
		mutationFn: solveProblem,
		onSuccess: options?.onSuccess,
		onError: options?.onError,
	});

	const followUp = useMutation({
		mutationFn: sendFollowUp,
	});

	return {
		...solve,
		solve: solve.mutate,
		followUp: followUp.mutate,
		followUpData: followUp.data,
		isSendingFollowUp: followUp.isPending,
		followUpError: followUp.error,
	};
}
