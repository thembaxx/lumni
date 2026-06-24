import {
  createRouteHandler,
  HttpError,
  isValidEmail,
  sanitizeEmail,
} from "@/lib/api/create-route-handler";
import { serverAccount } from "@/lib/appwrite.server";
import { logError } from "@/lib/shared/logger";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "Resend",
  validate: (body) => {
    if (!body.email) return "Email is required";
    if (!isValidEmail(body.email)) return "Invalid email format";
    return null;
  },
  execute: async ({ body }) => {
    const { email } = body as { email: string };
    const sanitizedEmail = sanitizeEmail(email);

    try {
      await serverAccount.createMagicURLToken(
        "unique()",
        sanitizedEmail,
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
      );
    } catch (error) {
      logError("AdminResend", error);
      throw new HttpError(500, "Failed to resend magic link");
    }

    return {
      success: true,
      message: "Magic link resent",
      email: sanitizedEmail,
    };
  },
});
