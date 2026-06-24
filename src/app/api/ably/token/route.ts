import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { createAblyTokenRequest } from "@/lib/ably/client";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "AblyToken",
  execute: async ({ userId }) => {
    if (!userId) throw new HttpError(401, "Not authenticated");
    const tokenRequest = await createAblyTokenRequest(userId);
    return tokenRequest as unknown as Record<string, unknown>;
  },
});
