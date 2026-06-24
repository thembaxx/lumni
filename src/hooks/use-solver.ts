"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { logError } from "@/lib/shared/logger";

interface SolverSource {
  url: string;
  title: string;
}

interface SolverResult {
  solution: string;
  steps: string[];
  provider: string;
  sources?: SolverSource[];
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

async function solveProblem({ question, subject }: SolveParams): Promise<SolverResult> {
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
    const error = await response.json().catch((e) => {
      logError("useSolver.json", e);
      return {};
    });
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
    const error = await response.json().catch((e) => {
      logError("useSolver.followUp.json", e);
      return {};
    });
    throw new Error(error.error || "Failed to get answer");
  }

  return response.json();
}

interface UseSolverOptions {
  onSuccess?: (result: SolverResult) => void;
  onError?: (error: Error) => void;
}

export function useSolver(options?: UseSolverOptions) {
  const queryClient = useQueryClient();

  const solve = useMutation({
    mutationFn: solveProblem,
    onSuccess: (result) => {
      options?.onSuccess?.(result);
      queryClient.invalidateQueries({ queryKey: ["solver"] });
    },
    onError: options?.onError,
  });

  const followUp = useMutation({
    mutationFn: sendFollowUp,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solver"] });
    },
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
