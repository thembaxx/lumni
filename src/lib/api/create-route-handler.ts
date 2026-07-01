import { type NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { AICallContext } from "@/lib/ai/call-context";
import { runWithAICallContext } from "@/lib/ai/call-context";
import type { AICallType } from "@/lib/ai/daily-call-tracker";
import { checkBudget, trackUsage } from "@/lib/ai/with-budget";
import { getAuthenticatedUserId, requireAdmin } from "@/lib/server/auth";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export type AuthMode = "none" | "optional" | "required" | "admin";

export interface RouteHandlerConfig<TBody, TResult = Record<string, unknown>> {
  auth: AuthMode;
  budget?: AICallType;
  parseBody?: (req: NextRequest) => Promise<TBody>;
  validate?: (body: TBody) => string | null;
  execute: (params: {
    body: TBody;
    userId: string | null;
    req: NextRequest;
    params?: Record<string, string>;
    requestId?: string;
  }) => Promise<TResult> | TResult;
  useRateLimit?: boolean;
  generateRequestId?: boolean;
  errorLabel?: string;
  aiContext?: AICallContext;
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

export class SecurityError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "SecurityError";
  }
}

function sanitizeErrorMessage(message: string): string {
  if (!message) return "Internal server error";

  const sensitivePatterns = [
    /password/i,
    /token/i,
    /secret/i,
    /key/i,
    /private/i,
    /sql/i,
    /query/i,
    /database/i,
    /stack/i,
    /trace/i,
    /line:/,
    /file:/,
    /c:\\/,
    /\/home\/\w+/,
    /\/tmp\//,
  ];

  let sanitized = message;
  for (const pattern of sensitivePatterns) {
    sanitized = sanitized.replace(pattern, "[REDACTED]");
  }

  if (sanitized !== message) {
    return "Internal server error";
  }

  return sanitized;
}

function serializeResponse(result: unknown): Record<string, unknown> {
  if (result === null || result === undefined) return {};
  if (typeof result === "object" && !Array.isArray(result))
    return result as Record<string, unknown>;
  return { data: result };
}

export function isSafeString(str: unknown): boolean {
  if (typeof str !== "string") return false;
  if (str.length === 0 || str.length > 1000) return false;
  return !/[\\"'`&<>]/.test(str);
}

export function isValidEmail(email: unknown): boolean {
  if (typeof email !== "string") return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function createRouteHandler<
  TBody = Record<string, unknown>,
  TResult = Record<string, unknown>,
>(config: RouteHandlerConfig<TBody, TResult>) {
  const {
    auth,
    budget,
    parseBody,
    validate,
    execute,
    useRateLimit = false,
    generateRequestId = false,
    errorLabel = "Handler",
    aiContext,
  } = config;

  const handler = async (
    req: NextRequest,
    context?: {
      params?: Promise<Record<string, string>> | Record<string, string>;
    },
  ) => {
    const requestId = generateRequestId ? uuidv4() : undefined;

    try {
      let userId: string | null = null;

      if (budget && auth !== "none" && auth !== "admin") {
        userId = await getAuthenticatedUserId();
      }

      if (budget) {
        const budgetResult = await checkBudget(req, budget, userId);
        if (!budgetResult.allowed) {
          return (
            budgetResult.response ??
            NextResponse.json({ error: "Budget exceeded" }, { status: 429 })
          );
        }
        userId = budgetResult.userId;
      }

      if (auth !== "none") {
        if (auth === "admin") {
          try {
            await requireAdmin();
          } catch (err) {
            const msg = err instanceof Error ? err.message : "Admin access required";
            if (msg.includes("Authentication required")) {
              throw new HttpError(401, msg);
            }
            throw new HttpError(403, msg);
          }
        } else if (!budget) {
          userId = await getAuthenticatedUserId();
          if (auth === "required" && !userId) {
            throw new HttpError(401, "Not authenticated");
          }
        }
      }

      let body = {} as TBody;

      const method = req?.method ?? "GET";
      if (method !== "GET" && method !== "HEAD") {
        if (parseBody) {
          body = await parseBody(req);
        } else {
          try {
            body = (await req.json()) as TBody;
          } catch {
            throw new HttpError(400, "Invalid JSON in request body");
          }
        }
      }

      if (validate) {
        const validationError = validate(body);
        if (validationError) {
          throw new HttpError(400, validationError);
        }
      }

      if (auth === "required" && !userId) {
        throw new HttpError(401, "Authentication required for this endpoint");
      }

      if (auth === "admin") {
        try {
          await requireAdmin();
        } catch {
          throw new SecurityError(403, "Admin privileges required");
        }
      }

      const resolvedParams =
        context?.params instanceof Promise ? await context.params : context?.params;

      const invokeExecute = () =>
        execute({
          body,
          userId,
          req,
          params: resolvedParams,
          requestId,
        });
      const result = aiContext
        ? await runWithAICallContext(aiContext, invokeExecute)
        : await invokeExecute();

      if (budget) {
        try {
          await trackUsage(budget, userId ?? "anonymous");
        } catch {
          // Usage tracking failure must not invalidate the response
        }
      }

      const response = NextResponse.json(serializeResponse(result));
      response.headers.set("X-Content-Type-Options", "nosniff");
      response.headers.set("X-Frame-Options", "DENY");
      response.headers.set("X-XSS-Protection", "1; mode=block");
      response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
      response.headers.set(
        "Permissions-Policy",
        "camera=(), microphone=(), geolocation=(), interest-cohort=()",
      );
      return response;
    } catch (error) {
      if (error instanceof HttpError) {
        return NextResponse.json(
          { error: sanitizeErrorMessage(error.message) },
          { status: error.status },
        );
      }
      if (error instanceof SecurityError) {
        return NextResponse.json({ error: "Access denied" }, { status: error.status });
      }
      logError(errorLabel, error);
      return NextResponse.json(
        {
          error: "Internal server error",
        },
        { status: 500 },
      );
    }
  };

  return useRateLimit ? withRateLimit(handler) : handler;
}
