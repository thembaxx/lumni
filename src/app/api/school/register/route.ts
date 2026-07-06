import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { createSchool } from "@/lib/school/service";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2).max(200),
  domain: z.string().optional(),
  contactEmail: z.string().email(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  agreeToTerms: z.literal(true),
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolRegister",
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

    const result = await createSchool(parsed.data, userId);

    return {
      schoolId: result.school.id,
      name: result.school.name,
      tier: result.school.licenseTier,
      seatCount: result.school.seatCount,
      seatsUsed: result.school.seatsUsed,
      billingStatus: result.school.billingStatus,
      joinCode: result.joinCode,
      adminId: userId,
    };
  },
});
