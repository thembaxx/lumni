import { createRouteHandler } from "@/lib/api/create-route-handler";
import { serverAccount } from "@/lib/appwrite.server";
import { logError } from "@/lib/shared/logger";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const POST = withRateLimit(
  createRouteHandler({
    auth: "none",
    execute: async ({ body, req }) => {
      const { email } = body as { email?: string };

      if (!email) {
        return { ok: true };
      }

      try {
        await serverAccount.createRecovery({
          email,
          url: `${new URL(req.url).origin}/auth/reset-password`,
        });
      } catch (error) {
        logError("ForgotPassword.Recovery", error);
      }

      return { ok: true };
    },
    errorLabel: "Forgot password",
  }),
  { max: 3, windowMs: 60000 },
);
