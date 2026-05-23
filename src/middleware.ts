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

export function middleware(request: NextRequest) {
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
	matcher: [
		"/((?!_next/static|_next/image|favicon.ico|apple-touch-icon.png|og-image.png|manifest.json|fonts|api/auth|api/uploadthing|api/csp-violation|api/cron|api/push|api/premium|api/referral|api/engine|api/analytics|api/leaderboard|api/session|api/sync|api/subjects|api/questions|api/exams|api/exam-dates|api/exam-sessions|api/exam-papers|api/solve|api/tts|api/chat|api/generate-element-fact|api/curated-problems|api/study-sessions|api/user|api/jobs|api/seed|api/test-exam-papers|api/import-exam-papers|api/lessons|api/download|api/rate-limit).*)",
	],
};
