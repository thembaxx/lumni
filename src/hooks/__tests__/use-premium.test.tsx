import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { PremiumFeature } from "@/lib/premium/premium-context";
import { PremiumProvider, usePremium } from "@/lib/premium/premium-context";

const mockStorage = new Map<string, unknown>();
const mockFetch =
	vi.fn<
		(url: string | URL | Request, init?: RequestInit) => Promise<Response>
	>();

vi.mock("@/lib/utils/storage", () => ({
	loadFromStorage: (key: string, defaultValue: unknown) =>
		mockStorage.has(key) ? mockStorage.get(key) : defaultValue,
	saveToStorage: (key: string, value: unknown) => {
		mockStorage.set(key, value);
	},
}));

globalThis.fetch = mockFetch as unknown as typeof fetch;

const FREE_FEATURES = ["ai-tutor", "unlimited-flashcards"];
const PREMIUM_FEATURES = [
	"ai-tutor",
	"advanced-analytics",
	"unlimited-flashcards",
	"custom-study-plans",
	"exam-simulator",
	"priority-support",
];

function createPremiumWrapper() {
	const qc = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={qc}>
				<PremiumProvider>{children}</PremiumProvider>
			</QueryClientProvider>
		);
	};
}

describe("usePremium", () => {
	beforeEach(() => {
		mockStorage.clear();
		mockFetch.mockReset();
	});

	test("initial state is free tier", () => {
		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		expect(result.current.isPremium).toBe(false);
		for (const f of FREE_FEATURES) {
			expect(result.current.hasFeature(f)).toBe(true);
		}
		const freeSet = new Set(FREE_FEATURES);
		for (const f of PREMIUM_FEATURES) {
			if (!freeSet.has(f)) {
				expect(result.current.hasFeature(f)).toBe(false);
			}
		}
	});

	test("upgrade sets isPremium to true with full features", async () => {
		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		await act(async () => {
			await result.current.upgrade();
		});

		expect(result.current.isPremium).toBe(true);
		for (const f of PREMIUM_FEATURES) {
			expect(result.current.hasFeature(f)).toBe(true);
		}
	});

	test("downgrade sets isPremium to false", async () => {
		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		await act(async () => {
			await result.current.upgrade();
		});
		expect(result.current.isPremium).toBe(true);

		await act(async () => {
			await result.current.downgrade();
		});

		expect(result.current.isPremium).toBe(false);
		for (const f of FREE_FEATURES) {
			expect(result.current.hasFeature(f)).toBe(true);
		}
	});

	test("hasFeature returns correct boolean", async () => {
		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		expect(result.current.hasFeature("ai-tutor" as PremiumFeature)).toBe(true);
		expect(result.current.hasFeature("exam-simulator" as PremiumFeature)).toBe(
			false,
		);

		await act(async () => {
			await result.current.upgrade();
		});

		expect(result.current.hasFeature("exam-simulator" as PremiumFeature)).toBe(
			true,
		);
		expect(
			result.current.hasFeature("priority-support" as PremiumFeature),
		).toBe(true);
	});

	test("createCheckoutSession calls /api/premium/checkout and returns url", async () => {
		mockFetch.mockResolvedValue({
			ok: true,
			json: async () => ({ url: "https://checkout.stripe.com/test" }),
		} as Response);

		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		const url = await result.current.createCheckoutSession();

		expect(url).toBe("https://checkout.stripe.com/test");
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/premium/checkout",
			expect.objectContaining({
				method: "POST",
				body: expect.stringContaining("price_premium_yearly"),
			}),
		);
	});

	test("createCheckoutSession returns null on non-ok response", async () => {
		mockFetch.mockResolvedValue({
			ok: false,
		} as Response);

		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		const url = await result.current.createCheckoutSession();

		expect(url).toBeNull();
	});

	test("cancelSubscription calls /api/premium/cancel and returns true on success", async () => {
		mockFetch.mockImplementation(async (url) => {
			if (url === "/api/premium/verify") {
				return {
					ok: true,
					json: async () => ({
						verified: true,
						isPremium: true,
						subscriptionId: "sub_test",
					}),
				} as unknown as Response;
			}
			if (url === "/api/premium/cancel") {
				return { ok: true } as unknown as Response;
			}
			return { ok: false } as unknown as Response;
		});

		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		await act(async () => {
			await new Promise((r) => setTimeout(r, 50));
		});

		const canceled = await result.current.cancelSubscription();

		expect(canceled).toBe(true);
		expect(mockFetch).toHaveBeenCalledWith(
			"/api/premium/cancel",
			expect.objectContaining({ method: "POST" }),
		);
	});

	test("cancelSubscription returns false on failure", async () => {
		mockFetch.mockRejectedValue(new Error("Network error"));

		const { result } = renderHook(() => usePremium(), {
			wrapper: createPremiumWrapper(),
		});

		const canceled = await result.current.cancelSubscription();

		expect(canceled).toBe(false);
	});
});
