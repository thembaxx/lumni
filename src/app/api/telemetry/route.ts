import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
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
        return new NextResponse(null, { status: 200 });
      }
    }

    return new NextResponse(null, { status: 200 });
  } catch {
    return new NextResponse(null, { status: 200 });
  }
}
