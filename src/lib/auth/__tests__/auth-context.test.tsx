import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockAccount = vi.hoisted(() => ({
  get: vi.fn(),
  createAnonymousSession: vi.fn(),
  createEmailPasswordSession: vi.fn(),
  createSession: vi.fn(),
  deleteSession: vi.fn(),
  updateName: vi.fn(),
}));

vi.mock("@/lib/appwrite", () => ({
  APPWRITE_ENDPOINT: "http://localhost",
  account: mockAccount,
}));

vi.mock("@/lib/shared/logger", () => ({
  logError: vi.fn(),
}));

vi.mock("@/lib/shared/rate-limiter", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 5 })),
  recordSuccessfulSignIn: vi.fn(),
}));

import { AuthProvider, useAuth } from "../auth-context";

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      {children}
    </QueryClientProvider>
  );
}

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="status">{auth.status}</span>
      <span data-testid="auth-ready">{String(auth.authReady)}</span>
      <span data-testid="user">{auth.user ? auth.user.$id : "null"}</span>
      <span data-testid="error">{auth.error ?? "null"}</span>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper });
}

describe("auth-context", () => {
  afterEach(cleanup);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with initial loading state", async () => {
    mockAccount.get.mockImplementation(() => new Promise(() => {}));
    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    expect(screen.getByTestId("auth-ready").textContent).toBe("false");
  });

  it("initialises session when account.get succeeds", async () => {
    mockAccount.get.mockResolvedValue({ $id: "user-123", $createdAt: "", email: "" });
    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(screen.getByTestId("auth-ready").textContent).toBe("true");
    });
    expect(screen.getByTestId("user").textContent).toBe("user-123");
  });

  it("falls back to anonymous session when account.get throws", async () => {
    mockAccount.get.mockRejectedValueOnce(new Error("No session"));
    mockAccount.createAnonymousSession.mockResolvedValue({
      $id: "anon-1",
      $createdAt: "",
      email: "",
    });
    mockAccount.get.mockResolvedValueOnce({ $id: "anon-1", $createdAt: "", email: "" });
    renderWithProviders(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );
    await waitFor(() => {
      expect(mockAccount.createAnonymousSession).toHaveBeenCalled();
    });
  });
});
