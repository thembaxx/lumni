import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { account } from "@/lib/appwrite";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
	createRouteHandler({
		auth: "none",
		validate: (body: Record<string, unknown>) => {
			if (!body.userId || !body.secret || !body.password)
				return "Missing required fields";
			if (typeof body.password === "string" && body.password.length < 8)
				return "Password must be at least 8 characters";
			return null;
		},
		execute: async ({ body }) => {
			const { userId, secret, password } = body as {
				userId: string;
				secret: string;
				password: string;
			};

			try {
				await account.updateRecovery(userId, secret, password);
			} catch (error) {
				logError("ResetPassword", error);
				const message =
					error instanceof Error ? error.message : "Failed to reset password";
				throw new HttpError(400, message);
			}

			return { success: true };
		},
		errorLabel: "Reset password",
	}),
	{ max: 3, windowMs: 60000 },
);
