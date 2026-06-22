import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("csp-report")) {
      const report = await request.json();
      console.warn("[CSP Violation]", JSON.stringify(report, null, 2));
    } else {
      const report = await request.json();
      console.warn("[CSP Violation]", JSON.stringify(report, null, 2));
    }

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
