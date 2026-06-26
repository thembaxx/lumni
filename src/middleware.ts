import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Block crawling on sensitive paths
  if (pathname.includes("/admin") || pathname.includes("/upload")) {
    // Don't block the page from rendering (client handles auth),
    // but add X-Robots-Tag header so crawlers don't index these
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|og-image.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
