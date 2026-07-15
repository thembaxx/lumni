import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { SchoolOnboardingWizard } from "../onboarding-wizard";

vi.mock("@/components/ui/toast", () => ({
  toast: vi.fn(),
}));

describe("SchoolOnboardingWizard", () => {
  afterEach(cleanup);

  test("renders step 1 (school info) by default", () => {
    render(<SchoolOnboardingWizard />);
    expect(screen.getByText("School Information")).toBeDefined();
    expect(screen.getByPlaceholderText("School name *")).toBeDefined();
    expect(screen.getByPlaceholderText("Contact email *")).toBeDefined();
    expect(screen.getByText("I agree to the Terms of Service")).toBeDefined();
    expect(screen.getByText("Next: Choose Plan")).toBeDefined();
  });

  test("renders step indicators for all 4 steps", () => {
    render(<SchoolOnboardingWizard />);
    expect(screen.getByText("Step 1 of 4")).toBeDefined();
    expect(screen.getByText("1")).toBeDefined();
    expect(screen.getByText("2")).toBeDefined();
    expect(screen.getByText("3")).toBeDefined();
    expect(screen.getByText("4")).toBeDefined();
  });

  test("renders all school info fields", () => {
    render(<SchoolOnboardingWizard />);
    expect(screen.getByLabelText("School name")).toBeDefined();
    expect(screen.getByLabelText("Domain")).toBeDefined();
    expect(screen.getByLabelText("Contact email")).toBeDefined();
    expect(screen.getByLabelText("Contact phone")).toBeDefined();
    expect(screen.getByLabelText("Address")).toBeDefined();
  });
});
