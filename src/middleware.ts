import createMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { locales, defaultLocale } from "./i18n/locales";
import { proxy } from "./proxy";

const intlMiddleware = createMiddleware({
	locales,
	defaultLocale,
	localeDetection: true,
	localePrefix: "as-needed",
});

export function middleware(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isApiRoute =
		pathname.startsWith("/api/") || pathname.startsWith("/monitoring");
	if (isApiRoute) {
		return NextResponse.next();
	}

	const intlResponse = intlMiddleware(request);

	const authResponse = proxy(request);

	if (authResponse.status !== 200) {
		return authResponse;
	}

	return intlResponse;
}

export const config = {
	matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
