import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

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

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	const isProtectedPage = PROTECTED_PAGES.some((prefix) =>
		pathname.startsWith(prefix),
	);

	if (isProtectedPage && !isAuthenticated(request)) {
		const signInUrl = new URL("/auth/sign-in", request.url);
		signInUrl.searchParams.set("redirect", pathname);
		return NextResponse.redirect(signInUrl);
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*$).*)"],
};
