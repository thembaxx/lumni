import { describe, expect, test } from "bun:test";

const {
	REFERRAL_DOMAIN,
	REFERRAL_REWARD_DAYS,
	REFERRAL_MONTHLY_LIMIT,
	buildReferralLink,
	generateReferralCode,
} = await import("../constants");

describe("referral constants", () => {
	test("REFERRAL_DOMAIN is correct URL", () => {
		expect(REFERRAL_DOMAIN).toBe("https://lumni-psi.vercel.app");
	});

	test("REFERRAL_REWARD_DAYS is 7", () => {
		expect(REFERRAL_REWARD_DAYS).toBe(7);
	});

	test("REFERRAL_MONTHLY_LIMIT is 10", () => {
		expect(REFERRAL_MONTHLY_LIMIT).toBe(10);
	});

	test("buildReferralLink creates URL with encoded code", () => {
		const link = buildReferralLink("LUMNI-ABC123");
		expect(link).toBe(
			"https://lumni-psi.vercel.app/auth/sign-up?ref=LUMNI-ABC123",
		);
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
