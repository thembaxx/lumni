import { type NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  try {
    const report = await request.json();

    Sentry.captureException(new Error("CSP Violation"), {
      extra: report,
      tags: { type: "csp-violation" },
    });

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
