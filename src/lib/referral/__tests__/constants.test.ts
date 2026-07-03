import { describe, expect, test } from "vitest";

const {
  REFERRAL_REWARD_XP_REFERRER,
  REFERRAL_REWARD_XP_REFEREE,
  REFERRAL_MONTHLY_LIMIT,
  getReferralDomain,
  buildReferralLink,
  generateReferralCode,
} = await import("../constants");

describe("referral constants", () => {
  test("getReferralDomain returns a URL", () => {
    expect(getReferralDomain()).toMatch(/^https?:\/\//);
  });

  test("REFERRAL_REWARD_XP_REFERRER is 500", () => {
    expect(REFERRAL_REWARD_XP_REFERRER).toBe(500);
  });

  test("REFERRAL_REWARD_XP_REFEREE is 250", () => {
    expect(REFERRAL_REWARD_XP_REFEREE).toBe(250);
  });

  test("REFERRAL_MONTHLY_LIMIT is 10", () => {
    expect(REFERRAL_MONTHLY_LIMIT).toBe(10);
  });

  test("buildReferralLink creates URL with encoded code", () => {
    const link = buildReferralLink("LUMNI-ABC123");
    expect(link).toContain("/auth/sign-up?ref=LUMNI-ABC123");
  });

  test("buildReferralLink encodes special characters", () => {
    const link = buildReferralLink("test code");
    expect(link).toContain("ref=test%20code");
  });

  test("generateReferralCode creates LUMNI-prefixed code", () => {
    const code = generateReferralCode("John Doe");
    expect(code).toMatch(/^LUMNI-JOHNDOE\d{2}$/);
  });

  test("generateReferralCode handles special chars", () => {
    const code = generateReferralCode("User!@#Name");
    expect(code).toMatch(/^LUMNI-USERNAME\d{2}$/);
  });
});
