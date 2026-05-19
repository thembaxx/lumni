import { type NextRequest, NextResponse } from "next/server";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import type { RouteHandler } from "@/lib/shared/with-rate-limit";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

interface EngineRouteConfig<T> {
	budgetType: AICallType;
	useRateLimit?: boolean;
	errorLabel: string;
	parseBody: (req: NextRequest) => Promise<T>;
	validate: (body: T) => string | null;
	execute: (
		body: T,
		helpers: { userId: string },
	) => Record<string, unknown> | Promise<Record<string, unknown>>;
}

export function createEngineHandler<T = Record<string, unknown>>(
	config: EngineRouteConfig<T>,
): RouteHandler {
	const {
		budgetType,
		useRateLimit = true,
		errorLabel,
		parseBody,
		validate,
		execute,
	} = config;

	const handler: RouteHandler = async (req: NextRequest) => {
		try {
			const budget = await checkBudget(req, budgetType);
			if (!budget.allowed) return budget.response!;

			const body = await parseBody(req);

			const validationError = validate(body);
			if (validationError) {
				return NextResponse.json({ error: validationError }, { status: 400 });
			}

			const result = await execute(body, { userId: budget.userId });

			trackUsage(budgetType, budget.userId);

			return NextResponse.json(result);
		} catch (error) {
			console.error(`[Engine ${errorLabel}] Error:`, error);
			return NextResponse.json(
				{
					error:
						error instanceof Error
							? error.message
							: `Failed to ${errorLabel.toLowerCase()}`,
				},
				{ status: 500 },
			);
		}
	};

	return useRateLimit ? withRateLimit(handler) : handler;
}
