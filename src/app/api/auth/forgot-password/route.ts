import { createRouteHandler } from "@/lib/api/create-route-handler";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

const APPWRITE_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";
const APPWRITE_PROJECT = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

export const POST = withRateLimit(
	createRouteHandler({
		auth: "none",
		execute: async ({ body, req }) => {
			const { email } = body as { email?: string };

			if (!email) {
				return { ok: true };
			}

			const res = await fetch(
				`${APPWRITE_ENDPOINT}/account/password/recovery`,
				{
					method: "POST",
					cache: "no-store",
					headers: {
						"Content-Type": "application/json",
						"X-Appwrite-Project": APPWRITE_PROJECT,
					},
					body: JSON.stringify({
						email,
						url: `${new URL(req.url).origin}/auth/reset-password`,
					}),
				},
			);

			if (!res.ok) {
				console.warn("Password recovery request failed:", await res.text());
			}

			return { ok: true };
		},
		errorLabel: "Forgot password",
	}),
	{ max: 3, windowMs: 60000 },
);
