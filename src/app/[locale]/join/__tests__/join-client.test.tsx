import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { JoinClient } from "../join-client";

const mockPush = vi.fn();

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockApiFetch = vi.fn();

vi.mock("@/lib/shared/api-fetch", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function renderJoin() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <JoinClient />
    </QueryClientProvider>,
  );
}

describe("JoinClient", () => {
  afterEach(cleanup);
  test("renders code input and submit button", () => {
    renderJoin();
    expect(screen.getByLabelText("Join code")).toBeDefined();
    expect(screen.getByRole("button", { name: /Join Classroom/i })).toBeDefined();
  });

  test("shows error state when code is invalid", async () => {
    mockApiFetch.mockRejectedValue(new Error("Invalid or expired join code"));
    renderJoin();
    const input = screen.getByLabelText("Join code");
    fireEvent.change(input, { target: { value: "ABCDEF" } });
    const button = screen.getByRole("button", { name: /Join Classroom/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeDefined();
    });
    expect(screen.getByText("Invalid or expired join code")).toBeDefined();
  });

  test("redirects on valid code", async () => {
    mockApiFetch.mockResolvedValue({ success: true, teacherId: "t1", subjectId: null });
    renderJoin();
    const input = screen.getByLabelText("Join code");
    fireEvent.change(input, { target: { value: "ABCDEF" } });
    const button = screen.getByRole("button", { name: /Join Classroom/i });
    fireEvent.click(button);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard?joined=success");
    });
  });
});
