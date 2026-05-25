import type { NextRequest } from "next/server";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import {
	createRouteHandler,
	type RouteHandlerConfig,
} from "./create-route-handler";

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

	const routeConfig: RouteHandlerConfig<T> = {
		auth: "none",
		budget: budgetType,
		useRateLimit,
		errorLabel,
		generateRequestId: true,
		parseBody,
		validate,
		execute: (params) =>
			service.execute(params.body, {
				userId: params.userId ?? "",
				requestId: params.requestId ?? "",
			}),
	};

	return createRouteHandler(routeConfig);
}
