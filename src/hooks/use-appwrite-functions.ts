"use client";

import { useCallback, useState } from "react";
import {
	type AppwriteExecution,
	executeFunction,
	listExecutions,
	listFunctions,
} from "./appwrite-functions";

interface UseAppwriteFunctionsOptions {
	functionId?: string;
}

interface UseAppwriteFunctionsReturn {
	execute: (
		functionId: string,
		payload?: Record<string, unknown>,
	) => Promise<AppwriteExecution | null>;
	loading: boolean;
	error: Error | null;
}

export function useAppwriteFunctions(
	_options: UseAppwriteFunctionsOptions = {},
): UseAppwriteFunctionsReturn {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);

	const execute = useCallback(
		async (functionId: string, payload?: Record<string, unknown>) => {
			setLoading(true);
			setError(null);
			try {
				const result = await executeFunction(functionId, {
					data: payload,
				});
				return result;
			} catch (e) {
				setError(e as Error);
				return null;
			} finally {
				setLoading(false);
			}
		},
		[],
	);

	return {
		execute,
		loading,
		error,
	};
}

interface UseFunctionExecutionsOptions {
	functionId: string;
	limit?: number;
}

interface UseFunctionExecutionsReturn {
	executions: AppwriteExecution[];
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useFunctionExecutions(
	options: UseFunctionExecutionsOptions,
): UseFunctionExecutionsReturn {
	const { functionId, limit = 25 } = options;
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [executions, setExecutions] = useState<AppwriteExecution[]>([]);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await listExecutions(functionId, [`limit(${limit})`]);
			setExecutions(result.executions);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoading(false);
		}
	}, [functionId, limit]);

	return {
		executions,
		loading,
		error,
		refresh,
	};
}

interface UseFunctionListReturn {
	functions: Awaited<ReturnType<typeof listFunctions>>["functions"];
	loading: boolean;
	error: Error | null;
	refresh: () => Promise<void>;
}

export function useFunctionList(): UseFunctionListReturn {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [functions, setFunctions] = useState<
		Awaited<ReturnType<typeof listFunctions>>["functions"]
	>([]);

	const refresh = useCallback(async () => {
		setLoading(true);
		setError(null);
		try {
			const result = await listFunctions();
			setFunctions(result.functions);
		} catch (e) {
			setError(e as Error);
		} finally {
			setLoading(false);
		}
	}, []);

	return {
		functions,
		loading,
		error,
		refresh,
	};
}
