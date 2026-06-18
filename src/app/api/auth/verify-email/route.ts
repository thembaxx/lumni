import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
	createRouteHandler({
		auth: "none",
		validate: (body: Record<string, unknown>) => {
			if (!body.userId || !body.secret) return "Missing userId or secret";
			return null;
		},
		execute: async ({ body }) => {
			const { userId, secret } = body as { userId: string; secret: string };

			try {
				await account.updateVerification(userId, secret);
			} catch (error) {
				logError("EmailVerification", error);
				throw new HttpError(500, "Failed to verify email");
			}

			return { verified: true };
		},
		errorLabel: "Email verification",
	}),
	{ max: 5, windowMs: 60000 },
);
