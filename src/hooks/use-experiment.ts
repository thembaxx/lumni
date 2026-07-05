"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo } from "react";
import { budgetFetch } from "@/lib/shared/api-fetch";
import { useAuth } from "@/lib/auth/auth-context";
import { getDB } from "@/lib/db/schema";

interface EvaluateResponse {
  variantId: string;
  flagValue: boolean;
}

async function evaluateOnServer(experimentId: string): Promise<EvaluateResponse> {
  return budgetFetch<EvaluateResponse>(
    "/api/experiment/evaluate",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ experimentId }),
    },
    "EvaluateExperiment",
  );
}

async function getCachedAssignment(userId: string, experimentId: string): Promise<string | null> {
  try {
    const db = getDB();
    const record = await db
      .table("experimentAssignments")
      .where("[userId+experimentId]")
      .equals([userId, experimentId])
      .first();
    return record ? (record as { variantId: string }).variantId : null;
  } catch {
    return null;
  }
}

async function persistAssignment(userId: string, experimentId: string, variantId: string) {
  try {
    const db = getDB();
    await db.table("experimentAssignments").put({
      userId,
      experimentId,
      variantId,
      assignedAt: new Date().toISOString(),
    });
  } catch {
    // Silently fail — cached assignment is optional
  }
}

export function useExperiment(experimentId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const queryKey = useMemo(
    () => ["experiment", experimentId, user?.$id],
    [experimentId, user?.$id],
  );

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async (): Promise<{ variantId: string | null; flagValue: boolean | null }> => {
      if (!user?.$id) {
        return { variantId: null, flagValue: null };
      }

      const cached = await getCachedAssignment(user.$id, experimentId);
      if (cached) {
        return { variantId: cached, flagValue: cached === "simplified" };
      }

      const result = await evaluateOnServer(experimentId);
      await persistAssignment(user.$id, experimentId, result.variantId);
      return { variantId: result.variantId, flagValue: result.flagValue };
    },
    enabled: !!experimentId && !!user?.$id,
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

  const refetch = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  return {
    variant: data?.variantId ?? null,
    flag: data?.flagValue ?? null,
    isLoading,
    refetch,
  };
}
