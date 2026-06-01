import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { serverAccount } from "@/lib/appwrite";

export const POST = createRouteHandler({
	auth: "none",
	errorLabel: "Resend",
	validate: (body) => {
		if (!body.email) return "Email is required";
		return null;
	},
	execute: async ({ body }) => {
		const { email } = body as { email: string };

		try {
			await serverAccount.createMagicURLToken(
				"unique()",
				email,
				`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
			);
		} catch {
			throw new HttpError(500, "Failed to resend magic link");
		}

		return {
			success: true,
			message: "Magic link resent",
			email,
		};
	},
});
