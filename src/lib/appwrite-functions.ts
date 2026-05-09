import { functions, type Models } from "./appwrite";

export type AppwriteFunction = Models.Function;
export type AppwriteExecution = Models.Execution;

export interface FunctionPayload {
	data?: Record<string, unknown>;
	async?: boolean;
}

export async function executeFunction(
	functionId: string,
	payload?: FunctionPayload,
): Promise<AppwriteExecution> {
	return functions.createExecution(
		functionId,
		payload?.async ? JSON.stringify(payload.data) : undefined,
	);
}

export async function getExecution(
	functionId: string,
	executionId: string,
): Promise<AppwriteExecution> {
	return functions.getExecution(functionId, executionId);
}

export async function listExecutions(
	functionId: string,
	queries: string[] = [],
): Promise<Models.ExecutionList> {
	return functions.listExecutions(functionId, queries);
}

export async function listFunctions(
	queries: string[] = [],
): Promise<Models.FunctionList> {
	return functions.list(queries);
}

export const waitForExecution = async (
	functionId: string,
	executionId: string,
	pollInterval = 500,
	timeout = 30000,
): Promise<AppwriteExecution> => {
	const startTime = Date.now();

	while (Date.now() - startTime < timeout) {
		const execution = await functions.getExecution(functionId, executionId);
		if (execution.status === "completed" || execution.status === "failed") {
			return execution;
		}
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	throw new Error(`Function execution timed out after ${timeout}ms`);
};

export interface ScheduledTaskConfig {
	functionId: string;
	cronExpression: string;
	name?: string;
}
