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

export interface ApiQueryConfig<TData, TParams> {
	queryKey: readonly unknown[] | ((params: TParams) => readonly unknown[]);
	fetchFn: (params: TParams) => Promise<TData>;
	staleTime?: number;
	enabled?: boolean | ((params: TParams) => boolean);
	retry?: number;
	select?: (data: TData) => TData;
	extraOptions?: Omit<
		UseQueryOptions<TData>,
		"queryKey" | "queryFn" | "enabled" | "staleTime" | "retry" | "select"
	>;
}

export function createApiQuery<TData, TParams>(
	config: ApiQueryConfig<TData, TParams>,
) {
	const {
		queryKey,
		fetchFn,
		staleTime = 1000 * 60 * 5,
		enabled = true,
		retry = 1,
		select,
		extraOptions,
	} = config;

	return function useApiQuery(
		params: TParams,
		options?: { enabled?: boolean },
	): UseQueryResult<TData> {
		const resolvedKey =
			typeof queryKey === "function" ? queryKey(params) : queryKey;
		const resolvedEnabled =
			typeof enabled === "function" ? enabled(params) : enabled;

		return useQuery<TData>({
			queryKey: resolvedKey,
			queryFn: () => fetchFn(params),
			enabled: options?.enabled ?? resolvedEnabled,
			staleTime,
			retry,
			select,
			...extraOptions,
		});
	};
}

// ─── createInvalidatingMutation ──────────────────────────────────────────────

export interface InvalidatingMutationConfig<TInput, TOutput, TMappedOutput> {
	endpoint: string | ((input: TInput) => string);
	method?: "POST" | "PUT" | "PATCH" | "DELETE";
	invalidateKey: readonly unknown[] | ((input: TInput) => readonly unknown[]);
	transformResponse?: (data: TOutput) => TMappedOutput;
	bodySerializer?: (input: TInput) => unknown;
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
	} = config;

	return function useInvalidatingMutation(): UseMutationResult<
		TMappedOutput,
		Error,
		TInput
	> {
		const queryClient = useQueryClient();

		return useMutation<TMappedOutput, Error, TInput>({
			mutationFn: async (input: TInput) => {
				const url = typeof endpoint === "function" ? endpoint(input) : endpoint;
				const res = await apiFetch<TOutput>(url, {
					method,
					headers:
						method !== "DELETE"
							? { "Content-Type": "application/json" }
							: undefined,
					body:
						method !== "DELETE"
							? JSON.stringify(bodySerializer(input))
							: undefined,
				});
				return transformResponse
					? transformResponse(res)
					: (res as unknown as TMappedOutput);
			},
			onSuccess: (_data, variables) => {
				const key =
					typeof invalidateKey === "function"
						? invalidateKey(variables)
						: invalidateKey;
				queryClient.invalidateQueries({ queryKey: key });
			},
		});
	};
}
