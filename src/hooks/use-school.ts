"use client";

import { createApiQuery, createInvalidatingMutation } from "@/hooks/use-hook-factories";
import { apiFetch } from "@/lib/shared/api-fetch";

interface SchoolBillingInfo {
  school: {
    id: string;
    name: string;
    licenseTier: string;
    billingStatus: string;
    seatCount: number;
    seatsUsed: number;
    trialEndsAt: number | null;
  };
  currentLicense: Record<string, unknown> | null;
  invoices: Record<string, unknown>[];
}

interface RegisterSchoolInput {
  name: string;
  domain: string;
  province: string;
  contactEmail: string;
}

export const useSchool = createApiQuery<SchoolBillingInfo, { schoolId: string }, SchoolBillingInfo>(
  {
    queryKey: (params) => ["school", params.schoolId],
    fetchFn: async ({ schoolId }) => {
      return apiFetch<SchoolBillingInfo>(
        `/api/school/billing?schoolId=${encodeURIComponent(schoolId)}`,
        { method: "GET" },
      );
    },
    enabled: (params) => !!params.schoolId,
  },
);

export const useRegisterSchool = createInvalidatingMutation<
  RegisterSchoolInput,
  { schoolId: string }
>({
  endpoint: "/api/school/register",
  invalidateKey: ["school"],
});

export const useCreateCheckout = createInvalidatingMutation<
  { schoolId: string; tier: string; billingFrequency: string },
  { url: string }
>({
  endpoint: "/api/school/checkout",
  invalidateKey: ["school"],
  transformResponse: (data) => data,
});
