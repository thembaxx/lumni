export const TIER_GATES: Record<string, "free" | "standard" | "premium"> = {
  "ai-questions": "free",
  "teacher-seats": "standard",
  "analytics-deep": "premium",
  "api-access": "premium",
  "ghost-links": "standard",
};

export function meetsTierRequirement(
  currentTier: string,
  requiredTier: "free" | "standard" | "premium",
): boolean {
  const tierOrder: Record<string, number> = { free: 0, standard: 1, premium: 2 };
  return (tierOrder[currentTier] ?? 0) >= tierOrder[requiredTier];
}

export function hasFeatureAccess(currentTier: string, feature: string): boolean {
  const required = TIER_GATES[feature];
  if (!required) return true;
  return meetsTierRequirement(currentTier, required);
}
