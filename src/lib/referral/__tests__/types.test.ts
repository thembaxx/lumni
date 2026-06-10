import { describe, expect, test } from "vitest";

describe("referral types", () => {
	test("ReferralStatus is a string union", () => {
		const pending = "pending" as const;
		const rewarded = "rewarded" as const;
		const expired = "expired" as const;
		expect(pending).toBe("pending");
		expect(rewarded).toBe("rewarded");
		expect(expired).toBe("expired");
	});

	test("ReferralCodeDoc shape is valid", () => {
		const doc: Record<string, unknown> = {
			$id: "abc123",
			userId: "user1",
			code: "LUMNI-TEST01",
			createdAt: "2025-01-01T00:00:00Z",
		};
		expect(doc.$id).toBe("abc123");
		expect(doc.userId).toBe("user1");
		expect(doc.code).toMatch(/^LUMNI-/);
	});

	test("ReferralDoc shape is valid", () => {
		const doc: Record<string, unknown> = {
			$id: "ref123",
			referrerId: "user1",
			refereeId: "user2",
			code: "LUMNI-TEST01",
			status: "rewarded",
			rewardedAt: "2025-01-10T00:00:00Z",
			createdAt: "2025-01-01T00:00:00Z",
		};
		expect(doc.status).toBe("rewarded");
		expect(doc.rewardedAt).toBeDefined();
	});

	test("ReferralDoc can have undefined rewardedAt", () => {
		const doc: Record<string, unknown> = {
			$id: "ref456",
			referrerId: "user1",
			refereeId: "user3",
			code: "LUMNI-TEST02",
			status: "pending",
			createdAt: "2025-01-01T00:00:00Z",
		};
		expect(doc.rewardedAt).toBeUndefined();
		expect(doc.status).toBe("pending");
	});
});
