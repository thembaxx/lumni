import type { NextRequest } from "next/server";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import {
	createRouteHandler,
	type RouteHandlerConfig,
} from "./create-route-handler";

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
) {
	const {
		budgetType,
		useRateLimit = true,
		errorLabel,
		parseBody,
		validate,
		execute,
	} = config;

	const routeConfig: RouteHandlerConfig<T> = {
		auth: "none",
		budget: budgetType,
		useRateLimit,
		errorLabel,
		parseBody,
		validate,
		execute: (params) => execute(params.body, { userId: params.userId ?? "" }),
	};

	return createRouteHandler(routeConfig);
}
