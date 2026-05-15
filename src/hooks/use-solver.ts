"use client";

import { useMutation } from "@tanstack/react-query";

interface SolverResult {
	solution: string;
	steps: string[];
	provider: string;
}

interface SolveParams {
	question: string;
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

interface UseSolverOptions {
	onSuccess?: (result: SolverResult) => void;
	onError?: (error: Error) => void;
}

export function useSolver(options?: UseSolverOptions) {
	return useMutation({
		mutationFn: solveProblem,
		onSuccess: options?.onSuccess,
		onError: options?.onError,
	});
}
