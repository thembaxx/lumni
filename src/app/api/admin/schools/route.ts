import { createRouteHandler } from "@/lib/api/create-route-handler";
import { listSchools } from "@/lib/school/service";

export const GET = createRouteHandler({
  auth: "admin",
  errorLabel: "AdminSchools",
  execute: async ({ req }) => {
    const url = new URL(req.url);
    const page = Math.max(1, Number.parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(url.searchParams.get("limit") ?? "20", 10)),
    );
    const status = url.searchParams.get("status") || undefined;
    const search = url.searchParams.get("search") || undefined;

    const result = await listSchools(page, limit, status, search);

    return {
      schools: result.schools.map((s) => ({
        id: s.id,
        name: s.name,
        domain: s.domain,
        licenseTier: s.licenseTier,
        billingStatus: s.billingStatus,
        seatCount: s.seatCount,
        seatsUsed: s.seatsUsed,
        trialEndsAt: s.trialEndsAt,
        createdAt: s.createdAt,
      })),
      page,
      totalSchools: result.total,
    };
  },
});
