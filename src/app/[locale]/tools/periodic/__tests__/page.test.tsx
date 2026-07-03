import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";

const mockParams = vi.fn(() => ({ symbol: "Fe" }));

vi.mock("next/navigation", () => ({
  useParams: () => mockParams(),
}));

vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock("@/components/shared/ambient-gradient", () => ({
  AmbientGradient: () => null,
}));

vi.mock("@/components/shared/noise-overlay", () => ({
  NoiseOverlay: () => null,
}));

vi.mock("@/components/layout/page-container", () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="page-container">{children}</div>
  ),
}));

vi.mock("@/components/tools/science/electron-shell-visual", () => ({
  ElectronShellVisual: () => <div data-testid="electron-shell" />,
}));

vi.mock("motion/react-m", () => ({
  default: {},
  m: new Proxy({}, { get: () => () => null }),
}));

afterEach(cleanup);

describe("ElementDetailPage", () => {
  test("renders iron element detail", async () => {
    const Page = (await import("../[symbol]/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toContain("Fe");
    expect(container.textContent).toContain("Iron");
    expect(container.textContent).toContain("Atomic Number 26");
    expect(container.textContent).toContain("55.85");
  });

  test("shows not found for invalid symbol", async () => {
    mockParams.mockReturnValueOnce({ symbol: "Xx" });

    const Page = (await import("../[symbol]/page")).default;
    const { container } = render(<Page />);
    expect(container.textContent).toContain("Element not found");
    expect(container.textContent).toContain("Xx");
  });
});
