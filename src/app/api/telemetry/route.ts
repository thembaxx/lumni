import { type NextRequest, NextResponse } from "next/server";
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

async function telemetryHandler(request: NextRequest): Promise<NextResponse> {
  try {
    const envelope = await request.text();
    const pieces = envelope.split("\n");
    const header = JSON.parse(pieces[0]);

    if (header?.type === "transaction") {
      const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
      if (dsn) {
        const sentryUrl = dsn
          .replace(/^https:\/\//, "https://")
          .replace(/\/\d+$/, `/api/${header.dsn?.split("/").pop()}/envelope/`);
        await fetch(sentryUrl, {
          method: "POST",
          body: envelope,
          headers: { "Content-Type": "application/x-sentry-envelope" },
        });
        return addSecurityHeaders(new NextResponse(null, { status: 200 }));
      }
    }

    return addSecurityHeaders(new NextResponse(null, { status: 200 }));
  } catch {
    return addSecurityHeaders(new NextResponse(null, { status: 200 }));
  }
}

export const POST = withRateLimit(telemetryHandler);
