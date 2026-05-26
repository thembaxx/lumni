import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { defaultLocale, locales } from "./src/i18n/locales";

const intlMiddleware = createMiddleware({
	locales,
	defaultLocale,
	localeDetection: true,
	localePrefix: "as-needed",
});

const PROTECTED_PAGES = ["/admin", "/teacher", "/parent"];

function getProjectCookieName(): string {
	const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
	return `a_session_${projectId}`;
}

function isAuthenticated(request: NextRequest): boolean {
	const cookieName = getProjectCookieName();
	return (
		request.cookies.has(cookieName) ||
		request.cookies.has(`${cookieName}_legacy`)
	);
}

function stripLocale(pathname: string): string {
	for (const locale of locales) {
		if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
			return pathname.slice(locale.length + 1) || "/";
		}
	}
	return pathname;
}

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isApiRoute =
		pathname.startsWith("/api/") || pathname.startsWith("/monitoring");
	if (isApiRoute) {
		return;
	}

	const strippedPath = stripLocale(pathname);
	const isProtectedPage = PROTECTED_PAGES.some((prefix) =>
		strippedPath.startsWith(prefix),
	);

	if (isProtectedPage && !isAuthenticated(request)) {
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return intlMiddleware(request);
}
