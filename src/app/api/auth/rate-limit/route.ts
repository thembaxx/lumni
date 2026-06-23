import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { AuthRateLimitService } from "@/lib/auth/rate-limit-service";

export const POST = createRouteHandler({
  auth: "none",
  errorLabel: "AuthRateLimit",
  validate: (body) => {
    if (!body.email || !body.action) return "Missing email or action";
    return null;
  },
  execute: async ({ body, req }) => {
    const { email, action } = body as { email: string; action: string };
    const service = new AuthRateLimitService();
    try {
      return await service.check(email, action, req);
    } catch (err) {
      throw new HttpError(400, err instanceof Error ? err.message : "Invalid action");
    }
  },
});
