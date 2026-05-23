import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
	"/",
	"/auth/sign-in",
	"/auth/sign-up",
	"/auth/forgot-password",
	"/auth/reset-password",
	"/auth/verify-email",
	"/api/auth",
	"/api/session",
	"/api/seed",
	"/api/cron",
	"/api/csp-violation",
	"/api/uploadthing",
	"/_next",
	"/favicon.ico",
	"/robots.txt",
	"/sitemap.xml",
	"/fonts",
];

export function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl;

	if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
		return;
	}

	const hasSessionCookie = request.cookies
		.getAll()
		.some((c) => c.name.startsWith("a_session_"));

	if (!hasSessionCookie) {
		if (pathname.startsWith("/api/")) {
			return Response.json({ error: "Not authenticated" }, { status: 401 });
		}
		const url = request.nextUrl.clone();
		url.pathname = "/auth/sign-in";
		url.searchParams.set("redirect", pathname);
		return Response.redirect(url);
	}
}
