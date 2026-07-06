import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";
import { getBillingInfo } from "@/lib/school/service";

export const GET = createRouteHandler({
  auth: "required",
  errorLabel: "SchoolBilling",
  execute: async ({ userId, req }) => {
    if (!userId) throw new HttpError(401, "Authentication required");

    const url = new URL(req.url);
    const schoolId = url.searchParams.get("schoolId");
    if (!schoolId) throw new HttpError(400, "schoolId query parameter is required");

    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      50,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10)),
    );

    const result = await getBillingInfo(schoolId, page, limit);
    if (!result.school) throw new HttpError(404, "School not found");

    return {
      school: {
        id: result.school.id,
        name: result.school.name,
        licenseTier: result.school.licenseTier,
        billingStatus: result.school.billingStatus,
        seatCount: result.school.seatCount,
        seatsUsed: result.school.seatsUsed,
        trialEndsAt: result.school.trialEndsAt,
      },
      currentLicense: result.currentLicense,
      invoices: result.invoices,
      page,
      totalPages: result.totalPages,
    };
  },
});
