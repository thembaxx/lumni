"use client";

import type { UseMutationResult } from "@tanstack/react-query";
import {
  type UseQueryOptions,
  type UseQueryResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { apiFetch } from "@/lib/shared/api-fetch";

// ─── createApiQuery ──────────────────────────────────────────────────────────

export interface ApiQueryConfig<TData, TParams, TSelected = TData> {
  queryKey: readonly unknown[] | ((params: TParams) => readonly unknown[]);
  fetchFn: (params: TParams) => Promise<TData>;
  staleTime?: number;
  enabled?: boolean | ((params: TParams) => boolean);
  retry?: number;
  refetchInterval?: number | false;
  select?: (data: TData) => TSelected;
  extraOptions?: Omit<
    UseQueryOptions<TData>,
    "queryKey" | "queryFn" | "enabled" | "staleTime" | "retry" | "select" | "refetchInterval"
  >;
}

export function createApiQuery<TData, TParams, TSelected = TData>(
  config: ApiQueryConfig<TData, TParams, TSelected>,
) {
  const {
    queryKey,
    fetchFn,
    staleTime = 1000 * 60 * 5,
    enabled = true,
    retry = 1,
    refetchInterval,
    select,
    extraOptions,
  } = config;

  return function useApiQuery(
    params: TParams,
    options?: { enabled?: boolean },
  ): UseQueryResult<TSelected> {
    const resolvedKey = typeof queryKey === "function" ? queryKey(params) : queryKey;
    const resolvedEnabled = typeof enabled === "function" ? enabled(params) : enabled;

    return useQuery<TData, Error, TSelected>({
      queryKey: resolvedKey,
      queryFn: () => fetchFn(params),
      enabled: options?.enabled ?? resolvedEnabled,
      staleTime,
      retry,
      refetchInterval,
      select: select as ((data: TData) => TSelected) | undefined,
      ...extraOptions,
    });
  };
}

// ─── createInvalidatingMutation ──────────────────────────────────────────────

export interface InvalidatingMutationConfig<TInput, TOutput, TMappedOutput> {
  endpoint?: string | ((input: TInput) => string);
  method?: "POST" | "PUT" | "PATCH" | "DELETE";
  invalidateKey: readonly unknown[] | ((input: TInput) => readonly unknown[]);
  transformResponse?: (data: TOutput) => TMappedOutput;
  bodySerializer?: (input: TInput) => unknown;
  mutationFn?: (input: TInput) => Promise<TOutput>;
  onSuccess?: (data: TMappedOutput, input: TInput) => void;
  onError?: (error: Error, input: TInput) => void;
}

export function createInvalidatingMutation<
  TInput,
  TOutput = { success: boolean },
  TMappedOutput = TOutput,
>(config: InvalidatingMutationConfig<TInput, TOutput, TMappedOutput>) {
  const {
    endpoint,
    method = "POST",
    invalidateKey,
    transformResponse,
    bodySerializer = (input) => input,
    mutationFn,
    onSuccess,
    onError,
  } = config;

  return function useInvalidatingMutation(): UseMutationResult<TMappedOutput, Error, TInput> {
    const queryClient = useQueryClient();

    return useMutation<TMappedOutput, Error, TInput>({
      mutationFn: mutationFn
        ? async (input: TInput) => {
            const result = await mutationFn(input);
            return transformResponse
              ? transformResponse(result as unknown as TOutput)
              : (result as unknown as TMappedOutput);
          }
        : async (input: TInput) => {
            const url = typeof endpoint === "function" ? endpoint(input) : endpoint!;
            const res = await apiFetch<TOutput>(url, {
              method,
              headers: method !== "DELETE" ? { "Content-Type": "application/json" } : undefined,
              body: method !== "DELETE" ? JSON.stringify(bodySerializer(input)) : undefined,
            });
            return transformResponse ? transformResponse(res) : (res as unknown as TMappedOutput);
          },
      onSuccess: (data, variables) => {
        const key = typeof invalidateKey === "function" ? invalidateKey(variables) : invalidateKey;
        queryClient.invalidateQueries({ queryKey: key });
        onSuccess?.(data, variables);
      },
      onError: (error, variables) => {
        onError?.(error, variables);
      },
    });
  };
}
