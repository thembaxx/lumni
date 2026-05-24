import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId, requireAdmin } from "@/lib/server/auth";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export type AuthMode = "none" | "optional" | "required" | "admin";

export interface RouteHandlerConfig<TBody, TResult = Record<string, unknown>> {
	auth: AuthMode;
	parseBody?: (req: NextRequest) => Promise<TBody>;
	validate?: (body: TBody) => string | null;
	execute: (params: {
		body: TBody;
		userId: string | null;
		req: NextRequest;
	}) => Promise<TResult> | TResult;
	useRateLimit?: boolean;
	errorLabel?: string;
}

export class HttpError extends Error {
	constructor(
		public status: number,
		message: string,
	) {
		super(message);
		this.name = "HttpError";
	}
}

function serializeResponse(result: unknown): Record<string, unknown> {
	if (result === null || result === undefined) return {};
	if (typeof result === "object" && !Array.isArray(result))
		return result as Record<string, unknown>;
	return { data: result };
}

export function createRouteHandler<
	TBody = Record<string, unknown>,
	TResult = Record<string, unknown>,
>(config: RouteHandlerConfig<TBody, TResult>) {
	const {
		auth,
		parseBody,
		validate,
		execute,
		useRateLimit = false,
		errorLabel = "Handler",
	} = config;

	const handler = async (req: NextRequest) => {
		try {
			let userId: string | null = null;

			if (auth !== "none") {
				if (auth === "admin") {
					await requireAdmin();
				} else {
					userId = await getAuthenticatedUserId();
					if (auth === "required" && !userId) {
						throw new HttpError(401, "Not authenticated");
					}
				}
			}

			let body = {} as TBody;

			if (req.method !== "GET" && req.method !== "HEAD") {
				if (parseBody) {
					body = await parseBody(req);
				} else {
					try {
						body = (await req.json()) as TBody;
					} catch {}
				}
			}

			if (validate) {
				const validationError = validate(body);
				if (validationError) {
					throw new HttpError(400, validationError);
				}
			}

			const result = await execute({ body, userId, req });
			return NextResponse.json(serializeResponse(result));
		} catch (error) {
			if (error instanceof HttpError) {
				return NextResponse.json(
					{ error: error.message },
					{ status: error.status },
				);
			}
			console.error(`[${errorLabel}] Error:`, error);
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
