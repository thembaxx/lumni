import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExamAnswer } from "@/types/exam-session";

interface SaveSessionParams {
  paperId: string;
  answers: Record<string, ExamAnswer>;
  flags: string[];
  timeRemaining: number;
  startedAt: string | null;
}

export function useExamSession(sessionId?: string | null) {
  const queryClient = useQueryClient();

  const sessionQuery = useQuery({
    queryKey: ["exam-session", sessionId],
    queryFn: async () => {
      if (!sessionId) throw new Error("No session ID");
      const res = await fetch(`/api/exam-sessions/${sessionId}`);
      if (!res.ok) throw new Error("Failed to fetch session");
      return res.json();
    },
    enabled: !!sessionId,
  });

  const saveMutation = useMutation({
    mutationFn: async (params: SaveSessionParams) => {
      const res = await fetch("/api/exam-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) throw new Error("Failed to save session");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/exam-sessions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete session");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["exam-sessions"] });
    },
  });

  return {
    session: sessionQuery.data,
    isLoading: sessionQuery.isLoading,
    save: saveMutation.mutate,
    isSaving: saveMutation.isPending,
    delete: deleteMutation.mutate,
    isDeleting: deleteMutation.isPending,
  };
}
