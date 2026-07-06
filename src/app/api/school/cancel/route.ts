import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { cancelSubscription } from "@/lib/school/billing-service";
import { isUserSchoolMember } from "@/lib/school/service";
import { z } from "zod";

const schema = z.object({
  schoolId: z.string(),
  reason: z.string().max(500).optional(),
  immediate: z.boolean().default(false),
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolCancel",
  useRateLimit: true,
  execute: async ({ body, userId }) => {
    if (!userId) throw new HttpError(401, "Authentication required");

    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      throw new HttpError(
        400,
        parsed.error.issues.map((e: { message: string }) => e.message).join(", "),
      );
    }

    const { schoolId, immediate } = parsed.data;

    const membership = await isUserSchoolMember(schoolId, userId);
    if (!membership.isMember || membership.role !== "admin") {
      throw new HttpError(403, "Only school admins can cancel subscriptions");
    }

    const result = await cancelSubscription(schoolId, immediate ?? false);
    if (!result) throw new HttpError(404, "No active license found");

    return result;
  },
});
