import { NextRequest, NextResponse } from "next/server";
import { buildCsp } from "@/lib/csp";
import { proxy } from "./proxy";

export function middleware(request: NextRequest) {
  const nonce = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-csp-nonce", nonce);

  const modifiedRequest = new NextRequest(request, { headers: requestHeaders });

  const response = proxy(modifiedRequest);

  if (response) {
    response.headers.set("Content-Security-Policy", buildCsp(nonce));
    return response;
  }

  const nextResponse = NextResponse.next({ request: { headers: requestHeaders } });
  nextResponse.headers.set("Content-Security-Policy", buildCsp(nonce));
  return nextResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|avif|json|txt|xml|webmanifest|js|map|woff2?|ttf|eot)).*)",
  ],
};
