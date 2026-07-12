import { describe, it, expect } from "vitest";
import { meetsTierRequirement, TIER_GATES, hasFeatureAccess } from "../tier-enforcer";

describe("meetsTierRequirement", () => {
  it("allows free tier for free features", () => {
    expect(meetsTierRequirement("free", "free")).toBe(true);
  });
  it("blocks free tier for standard features", () => {
    expect(meetsTierRequirement("free", "standard")).toBe(false);
  });
  it("allows premium tier for all features", () => {
    expect(meetsTierRequirement("premium", "free")).toBe(true);
    expect(meetsTierRequirement("premium", "standard")).toBe(true);
    expect(meetsTierRequirement("premium", "premium")).toBe(true);
  });
  it("blocks free tier for premium features", () => {
    expect(meetsTierRequirement("free", "premium")).toBe(false);
  });
  it("allows standard tier for standard features", () => {
    expect(meetsTierRequirement("standard", "standard")).toBe(true);
  });
  it("blocks standard tier for premium features", () => {
    expect(meetsTierRequirement("standard", "premium")).toBe(false);
  });
});

describe("TIER_GATES", () => {
  it("defines expected gates", () => {
    expect(TIER_GATES["ai-questions"]).toBe("free");
    expect(TIER_GATES["teacher-seats"]).toBe("standard");
    expect(TIER_GATES["analytics-deep"]).toBe("premium");
    expect(TIER_GATES["api-access"]).toBe("premium");
    expect(TIER_GATES["ghost-links"]).toBe("standard");
  });
});

describe("hasFeatureAccess", () => {
  it("returns true for unknown features", () => {
    const result = hasFeatureAccess("free", "unknown-feature");
    expect(result).toBe(true);
  });
  it("checks feature access correctly", () => {
    expect(hasFeatureAccess("free", "ghost-links")).toBe(false);
    expect(hasFeatureAccess("standard", "ghost-links")).toBe(true);
    expect(hasFeatureAccess("premium", "analytics-deep")).toBe(true);
    expect(hasFeatureAccess("standard", "analytics-deep")).toBe(false);
  });
});
