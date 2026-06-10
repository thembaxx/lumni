import { beforeEach, describe, expect, test, vi } from "vitest";

const mockGetAuthenticatedUserId = vi.fn<() => Promise<string | null>>();
const mockGetAuthenticatedUserName = vi.fn<() => Promise<string | null>>();

vi.mock("@/lib/server/auth", () => ({
	getAuthenticatedUserId: mockGetAuthenticatedUserId,
	getAuthenticatedUserName: mockGetAuthenticatedUserName,
}));

const mockListDocuments = vi.fn();
const mockCreateDocument = vi.fn();
const mockUpdateDocument = vi.fn();

vi.mock("appwrite", () => {
	function MockClient() {
		this.setEndpoint = vi.fn().mockReturnThis();
		this.setProject = vi.fn().mockReturnThis();
	}
	function MockDatabases() {
		return {
			listDocuments: mockListDocuments,
			createDocument: mockCreateDocument,
			updateDocument: mockUpdateDocument,
		};
	}
	function MockStorage() {}
	function MockFunctions() {}
	function MockAccount() {}
	return {
		Client: MockClient,
		Databases: MockDatabases,
		Storage: MockStorage,
		Functions: MockFunctions,
		Account: MockAccount,
		ID: { unique: () => "id-123" },
		Query: { equal: vi.fn(), limit: vi.fn() },
	};
});

const { NextRequest } = await import("next/server");
const { POST } = await import("@/app/api/gamification/route");

describe("POST /api/gamification", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetAuthenticatedUserId.mockResolvedValue("test-user");
		mockGetAuthenticatedUserName.mockResolvedValue("Test User");
		mockListDocuments.mockReset();
		mockCreateDocument.mockReset();
		mockUpdateDocument.mockReset();
	});

	test("valid fields succeed", async () => {
		mockListDocuments.mockResolvedValue({ documents: [] });

		const req = new NextRequest("http://localhost/api/gamification", {
			method: "POST",
			body: JSON.stringify({ totalXp: 50, currentStreak: 3 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ success: true });
		expect(mockCreateDocument).toHaveBeenCalled();
	});

	test("unknown fields return 400", async () => {
		const req = new NextRequest("http://localhost/api/gamification", {
			method: "POST",
			body: JSON.stringify({ admin: true, totalXp: 999999 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toContain("Invalid gamification data");
	});

	test("wrong types return 400", async () => {
		const req = new NextRequest("http://localhost/api/gamification", {
			method: "POST",
			body: JSON.stringify({ totalXp: "not-a-number" }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toContain("Invalid gamification data");
	});

	test("empty body returns 400", async () => {
		const req = new NextRequest("http://localhost/api/gamification", {
			method: "POST",
			body: JSON.stringify({}),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(400);
		expect(body.error).toContain("Invalid gamification data");
	});

	test("valid partial body succeeds", async () => {
		mockListDocuments.mockResolvedValue({ documents: [] });

		const req = new NextRequest("http://localhost/api/gamification", {
			method: "POST",
			body: JSON.stringify({ totalXp: 100 }),
		});
		const res = await POST(req);
		const body = await res.json();

		expect(res.status).toBe(200);
		expect(body).toEqual({ success: true });
	});
});
