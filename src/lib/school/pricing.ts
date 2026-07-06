export const PRICING = {
  free: {
    label: "Free",
    teacherSeatsIncluded: 1,
    extraSeatPrice: 0,
    monthlyPrice: 0,
    annualPrice: 0,
    aiQuestionsPerDay: 20,
    ghostLinks: 0,
  },
  standard: {
    label: "Standard",
    teacherSeatsIncluded: 5,
    extraSeatPrice: 2500,
    monthlyPrice: 5000,
    annualPrice: 42000,
    aiQuestionsPerDay: 500,
    ghostLinks: 5,
  },
  premium: {
    label: "Premium",
    teacherSeatsIncluded: 25,
    extraSeatPrice: 2000,
    monthlyPrice: 25000,
    annualPrice: 208000,
    aiQuestionsPerDay: 2000,
    ghostLinks: -1,
  },
} as const;

export type LicenseTier = keyof typeof PRICING;

export function calculatePrice(
  tier: LicenseTier,
  seatCount: number,
  billingFrequency: "monthly" | "annual",
): number {
  if (tier === "free") return 0;
  const config = PRICING[tier];
  const basePrice = billingFrequency === "annual" ? config.annualPrice : config.monthlyPrice;
  const extraSeats = Math.max(0, seatCount - config.teacherSeatsIncluded);
  const extraCost = extraSeats * config.extraSeatPrice * (billingFrequency === "annual" ? 12 : 1);
  return basePrice + extraCost;
}

export function generateSchoolCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
