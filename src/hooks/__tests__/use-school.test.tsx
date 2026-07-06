import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";

const mockApiFetch = vi.fn();

vi.mock("@/lib/shared/api-fetch", () => ({
  apiFetch: mockApiFetch,
  budgetFetch: vi.fn(),
  isBudgetExceeded: vi.fn(() => false),
  showBudgetToast: vi.fn(),
}));

const { useSchool } = await import("@/hooks/use-school");

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

const mockBillingData = {
  school: {
    id: "school-1",
    name: "Test School",
    licenseTier: "premium",
    billingStatus: "active",
    seatCount: 25,
    seatsUsed: 10,
    trialEndsAt: null,
  },
  currentLicense: { stripeSubscriptionId: "sub_123" },
  invoices: [],
  page: 1,
  totalPages: 1,
};

describe("useSchool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("loads school billing data", async () => {
    mockApiFetch.mockResolvedValue(mockBillingData);
    const { result } = renderHook(() => useSchool({ schoolId: "school-1" }), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.school.name).toBe("Test School");
  });

  test("handles 404 (no school)", async () => {
    mockApiFetch.mockRejectedValue(new Error("School not found"));
    const { result } = renderHook(() => useSchool({ schoolId: "nonexistent" }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
  });

  test("handles API error", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useSchool({ schoolId: "school-1" }), { wrapper });
    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 5000 });
    expect(result.current.error?.message).toBe("Network error");
  });
});
