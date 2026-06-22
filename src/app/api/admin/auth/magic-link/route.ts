import { z } from "zod";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { serverAccount } from "@/lib/appwrite.server";

const magicLinkSchema = z.object({
  email: z.email("Please enter a valid email address"),
});

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "MagicLink",
  validate: (body) => {
    const result = magicLinkSchema.safeParse(body);
    if (!result.success) {
      return result.error.issues[0]?.message || "Invalid email";
    }
    return null;
  },
  execute: async ({ body }) => {
    const { email } = body as z.infer<typeof magicLinkSchema>;

    try {
      await serverAccount.createMagicURLToken(
        "unique()",
        email,
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback`,
      );
    } catch (error) {
      const appwriteError = error as { message?: string };
      if (appwriteError.message?.includes("already exists")) {
        throw new HttpError(400, "Email already registered");
      }
      throw new HttpError(500, "Failed to send magic link");
    }

    return {
      success: true,
      message: "Magic link sent to your email",
      email,
    };
  },
});
