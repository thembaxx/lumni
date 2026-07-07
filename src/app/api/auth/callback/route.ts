import { type NextRequest, NextResponse } from "next/server";
import { account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    if (!userId || !secret) {
      return addSecurityHeaders(
        NextResponse.redirect(new URL("/?error=missing_params", request.url)),
      );
    }

    await account.createSession(userId, secret);

    return addSecurityHeaders(
      NextResponse.redirect(new URL("/dashboard?auth=success", request.url)),
    );
  } catch (error) {
    logError("AuthCallback", error);
    return addSecurityHeaders(NextResponse.redirect(new URL("/?error=auth_failed", request.url)));
  }
}
