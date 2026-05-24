import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

interface AIHandlerConfig<T> {
	budgetType: AICallType;
	errorLabel: string;
	service: {
		execute: (
			body: T,
			helpers: { userId: string; requestId: string },
		) => Promise<Record<string, unknown>>;
	};
	parseBody: (req: NextRequest) => Promise<T>;
	validate?: (body: T) => string | null;
	useRateLimit?: boolean;
}

export function createAIHandler<T>(config: AIHandlerConfig<T>) {
	const {
		budgetType,
		errorLabel,
		service,
		parseBody,
		validate,
		useRateLimit = true,
	} = config;

	const handler = async (req: NextRequest) => {
		const requestId = uuidv4();

		try {
			const budget = await checkBudget(req, budgetType);
			if (!budget.allowed) {
				return (
					budget.response ??
					NextResponse.json({ error: "Budget exceeded" }, { status: 429 })
				);
			}

			const body = await parseBody(req);

			if (validate) {
				const validationError = validate(body);
				if (validationError) {
					return NextResponse.json({ error: validationError }, { status: 400 });
				}
			}

			const result = await service.execute(body, {
				userId: budget.userId,
				requestId,
			});

			await trackUsage(budgetType, budget.userId);

			return NextResponse.json(result);
		} catch (error) {
			console.error(`[AI ${errorLabel}] Error:`, error);
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
