import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(_request: NextRequest) {
	return NextResponse.next();
}

export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api/auth (auth endpoints)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 * - public files
		 */
		"/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)",
	],
};
