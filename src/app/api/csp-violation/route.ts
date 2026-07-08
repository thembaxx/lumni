import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  return response;
}

async function cspHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const report = await request.json();

    Sentry.captureException(new Error("CSP Violation"), {
      extra: report,
      tags: { type: "csp-violation" },
    });

    return addSecurityHeaders(new NextResponse(null, { status: 204 }));
  } catch {
    return addSecurityHeaders(new NextResponse(null, { status: 204 }));
  }
}

export const POST = withRateLimit(cspHandler);
