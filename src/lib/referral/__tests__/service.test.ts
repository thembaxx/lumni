import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/appwrite", () => ({
	APPWRITE_ENDPOINT: "https://jnb.cloud.appwrite.io/v1",
	APPWRITE_PROJECT: "test-project",
	APPWRITE_API_KEY: "test-key",
	databases: {},
	browserDatabases: {},
	storage: {},
	functions: {},
	account: {},
	serverAccount: {},
	serverClient: {},
}));

const mockListDocuments =
	vi.fn<(collection: string, queries: string[]) => unknown[]>();
const mockCreateDocument =
	vi.fn<(collection: string, data: Record<string, unknown>) => string>();
const mockUpdateDocument =
	vi.fn<
		(
			collection: string,
			documentId: string,
			data: Record<string, unknown>,
		) => void
	>();

vi.mock("@/lib/db/client", () => ({
	APPWRITE_DATABASE_ID: "test-db-id",
	COLLECTIONS: {
		REFERRAL_CODES: "referral_codes",
		REFERRALS: "referrals",
	},
	createDocument: mockCreateDocument,
	listDocuments: mockListDocuments,
	updateDocument: mockUpdateDocument,
}));

const {
	getReferralCode,
	createReferralCode,
	getReferralByCode,
	getReferralsByReferrer,
	getReferralCountThisMonth,
	createReferral,
	updateReferralStatus,
	getReferralByReferee,
	getReferrerCodeForUserId,
} = await import("../service");

beforeEach(() => {
	mockListDocuments.mockReset();
	mockCreateDocument.mockReset();
	mockUpdateDocument.mockReset();
});

describe("getReferralCode", () => {
	test("returns referral code doc when found", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "rc1",
				userId: "user1",
				code: "LUMNI-ABC",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		const result = await getReferralCode("user1");

		expect(result).toEqual({
			$id: "rc1",
			userId: "user1",
			code: "LUMNI-ABC",
			createdAt: "2025-01-01T00:00:00Z",
		});
		expect(mockListDocuments).toHaveBeenCalledWith(
			"referral_codes",
			expect.arrayContaining([expect.any(String), expect.any(String)]),
		);
	});

	test("returns null when no referral code exists", async () => {
		mockListDocuments.mockResolvedValue([]);

		const result = await getReferralCode("user_none");
		expect(result).toBeNull();
	});
});

describe("createReferralCode", () => {
	test("creates a referral code document", async () => {
		mockCreateDocument.mockResolvedValue("rc_new");

		const result = await createReferralCode({
			userId: "user1",
			code: "LUMNI-ABC",
		});

		expect(result).toBe("rc_new");
		expect(mockCreateDocument).toHaveBeenCalledWith("referral_codes", {
			userId: "user1",
			code: "LUMNI-ABC",
			createdAt: expect.any(String),
		});
	});
});

describe("getReferralByCode", () => {
	test("returns referral code doc for given code", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "rc1",
				userId: "user1",
				code: "LUMNI-ABC",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		const result = await getReferralByCode("LUMNI-ABC");

		expect(result).not.toBeNull();
		expect(result?.code).toBe("LUMNI-ABC");
	});

	test("returns null when code not found", async () => {
		mockListDocuments.mockResolvedValue([]);

		const result = await getReferralByCode("NONEXISTENT");
		expect(result).toBeNull();
	});
});

describe("getReferralsByReferrer", () => {
	test("returns referrals for a referrer", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "r1",
				referrerId: "user1",
				refereeId: "user2",
				code: "LUMNI-ABC",
				status: "pending",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		const result = await getReferralsByReferrer("user1");

		expect(result).toHaveLength(1);
		expect(result[0].referrerId).toBe("user1");
	});

	test("returns empty array when no referrals", async () => {
		mockListDocuments.mockResolvedValue([]);

		const result = await getReferralsByReferrer("user_none");
		expect(result).toEqual([]);
	});
});

describe("getReferralCountThisMonth", () => {
	test("returns count of referrals this month", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "r1",
				referrerId: "user1",
				refereeId: "user2",
				code: "LUMNI-ABC",
				status: "pending",
				createdAt: new Date().toISOString(),
			},
		]);

		const count = await getReferralCountThisMonth("user1");

		expect(count).toBe(1);
	});

	test("returns 0 when no referrals this month", async () => {
		mockListDocuments.mockResolvedValue([]);

		const count = await getReferralCountThisMonth("user1");
		expect(count).toBe(0);
	});
});

describe("createReferral", () => {
	test("creates a referral document", async () => {
		mockCreateDocument.mockResolvedValue("ref_new");

		const result = await createReferral({
			referrerId: "user1",
			refereeId: "user2",
			code: "LUMNI-ABC",
			status: "pending",
		});

		expect(result).toBe("ref_new");
		expect(mockCreateDocument).toHaveBeenCalledWith("referrals", {
			referrerId: "user1",
			refereeId: "user2",
			code: "LUMNI-ABC",
			status: "pending",
			createdAt: expect.any(String),
		});
	});
});

describe("updateReferralStatus", () => {
	test("updates status to rewarded and sets rewardedAt", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "ref1",
				referrerId: "user1",
				refereeId: "user2",
				code: "LUMNI-ABC",
				status: "pending",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		await updateReferralStatus("user2", "rewarded");

		expect(mockUpdateDocument).toHaveBeenCalledWith("referrals", "ref1", {
			status: "rewarded",
			rewardedAt: expect.any(String),
		});
	});

	test("does nothing when no matching referral found", async () => {
		mockListDocuments.mockResolvedValue([]);

		await updateReferralStatus("nonexistent", "expired");

		expect(mockUpdateDocument).not.toHaveBeenCalled();
	});
});

describe("getReferralByReferee", () => {
	test("returns referral doc for referee", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "ref1",
				referrerId: "user1",
				refereeId: "user2",
				code: "LUMNI-ABC",
				status: "pending",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		const result = await getReferralByReferee("user2");

		expect(result).not.toBeNull();
		expect(result?.refereeId).toBe("user2");
	});

	test("returns null when referee not found", async () => {
		mockListDocuments.mockResolvedValue([]);

		const result = await getReferralByReferee("nobody");
		expect(result).toBeNull();
	});
});

describe("getReferrerCodeForUserId", () => {
	test("returns code from getReferralCode result", async () => {
		mockListDocuments.mockResolvedValue([
			{
				$id: "rc1",
				userId: "user1",
				code: "LUMNI-ABC",
				createdAt: "2025-01-01T00:00:00Z",
			},
		]);

		const code = await getReferrerCodeForUserId("user1");

		expect(code).toBe("LUMNI-ABC");
	});

	test("returns null when user has no code", async () => {
		mockListDocuments.mockResolvedValue([]);

		const code = await getReferrerCodeForUserId("user_none");
		expect(code).toBeNull();
	});
});
