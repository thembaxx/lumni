import { describe, expect, it } from "vitest";
import { bucketUser, djb2Hash, isFlagEnabled } from "../resolver";
import type { FlagDefinition, FlagOverride } from "../types";

function makeFlags(overrides: Record<string, Partial<FlagDefinition>>): Record<string, FlagDefinition> {
  const base: Record<string, FlagDefinition> = {
    "test-flag": {
      key: "test-flag",
      description: "A test flag",
      defaultEnabled: false,
    },
    "test-experiment": {
      key: "test-experiment",
      description: "A test experiment",
      defaultEnabled: false,
      isExperiment: true,
      bucketKey: "test-exp-1",
      experimentRatio: 0.5,
    },
    "test-rollout": {
      key: "test-rollout",
      description: "A test rollout",
      defaultEnabled: false,
      rolloutPercentage: 50,
    },
    "test-default-true": {
      key: "test-default-true",
      description: "A flag that defaults to true",
      defaultEnabled: true,
    },
  };

  for (const [key, val] of Object.entries(overrides)) {
    if (base[key]) {
      Object.assign(base[key], val);
    } else {
      base[key] = { key, description: "", defaultEnabled: false, ...val } as FlagDefinition;
    }
  }

  return base;
}

describe("djb2Hash", () => {
  it("returns consistent results for the same input", () => {
    const a = djb2Hash("hello");
    const b = djb2Hash("hello");
    expect(a).toBe(b);
  });

  it("returns different results for different inputs", () => {
    const a = djb2Hash("hello");
    const b = djb2Hash("world");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const result = djb2Hash("");
    expect(typeof result).toBe("number");
    expect(result).toBeGreaterThanOrEqual(0);
  });

  it("handles unicode characters", () => {
    const a = djb2Hash("café");
    const b = djb2Hash("cafe");
    expect(a).not.toBe(b);
  });
});

describe("bucketUser", () => {
  it("returns consistent bucket for same userId + bucketKey", () => {
    const a = bucketUser("user-1", "test-key", 100);
    const b = bucketUser("user-1", "test-key", 100);
    expect(a).toBe(b);
  });

  it("returns a value in [0, totalBuckets)", () => {
    const result = bucketUser("user-1", "test-key", 100);
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThan(100);
  });

  it("distributes different users differently", () => {
    const a = bucketUser("user-1", "test-key", 100);
    const b = bucketUser("user-2", "test-key", 100);
    expect(a).not.toBe(b);
  });

  it("different bucketKeys produce different buckets", () => {
    const a = bucketUser("user-1", "key-a", 100);
    const b = bucketUser("user-1", "key-b", 100);
    expect(a).not.toBe(b);
  });
});

describe("isFlagEnabled", () => {
  it("returns defaultEnabled when no overrides", () => {
    const flags = makeFlags({});
    expect(isFlagEnabled("test-default-true", undefined, [], flags)).toBe(true);
    expect(isFlagEnabled("test-flag", undefined, [], flags)).toBe(false);
  });

  it("returns defaultEnabled when no overrides and no userId", () => {
    const flags = makeFlags({});
    expect(isFlagEnabled("test-default-true", undefined, [], flags)).toBe(true);
  });

  it("returns false for unknown flag", () => {
    expect(isFlagEnabled("nonexistent", undefined, [], makeFlags({}))).toBe(false);
  });

  it("user-level override beats global override", () => {
    const flags = makeFlags({});
    const overrides: FlagOverride[] = [
      { key: "test-flag", enabled: false },
      { key: "test-flag", enabled: true, userId: "user-1" },
    ];
    expect(isFlagEnabled("test-flag", "user-1", overrides, flags)).toBe(true);
    expect(isFlagEnabled("test-flag", "user-2", overrides, flags)).toBe(false);
  });

  it("global override is used when no user override exists", () => {
    const flags = makeFlags({});
    const overrides: FlagOverride[] = [
      { key: "test-flag", enabled: true },
    ];
    expect(isFlagEnabled("test-flag", "user-1", overrides, flags)).toBe(true);
  });

  it("experiment bucketing returns treatment for some users", () => {
    const flags = makeFlags({});
    const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    const treatmentUsers = users.filter(
      (u) => isFlagEnabled("test-experiment", u, [], flags),
    );
    expect(treatmentUsers.length).toBeGreaterThan(30);
    expect(treatmentUsers.length).toBeLessThan(70);
  });

  it("experiment bucketing is deterministic for same user", () => {
    const flags = makeFlags({});
    const a = isFlagEnabled("test-experiment", "user-1", [], flags);
    const b = isFlagEnabled("test-experiment", "user-1", [], flags);
    expect(a).toBe(b);
  });

  it("respects experimentRatio at the boundary", () => {
    const flags = makeFlags({
      "zero-exp": {
        key: "zero-exp",
        description: "",
        defaultEnabled: false,
        isExperiment: true,
        bucketKey: "zero-exp-1",
        experimentRatio: 0,
      },
      "full-exp": {
        key: "full-exp",
        description: "",
        defaultEnabled: false,
        isExperiment: true,
        bucketKey: "full-exp-1",
        experimentRatio: 1.0,
      },
    });
    expect(isFlagEnabled("zero-exp", "user-1", [], flags)).toBe(false);
    expect(isFlagEnabled("full-exp", "user-1", [], flags)).toBe(true);
  });

  it("rolloutPercentage gates users", () => {
    const flags = makeFlags({});
    const users = Array.from({ length: 100 }, (_, i) => `user-${i}`);
    const enabledUsers = users.filter(
      (u) => isFlagEnabled("test-rollout", u, [], flags),
    );
    expect(enabledUsers.length).toBeGreaterThan(30);
    expect(enabledUsers.length).toBeLessThan(70);
  });

  it("override beats experiment bucketing", () => {
    const flags = makeFlags({});
    const overrides: FlagOverride[] = [
      { key: "test-experiment", enabled: false, userId: "user-1" },
    ];
    // user-1 would normally get treatment, but override should force false
    const result = isFlagEnabled("test-experiment", "user-1", overrides, flags);
    expect(result).toBe(false);
  });

  it("override beats rollout percentage", () => {
    const flags = makeFlags({});
    const overrides: FlagOverride[] = [
      { key: "test-rollout", enabled: false },
    ];
    expect(isFlagEnabled("test-rollout", "any-user", overrides, flags)).toBe(false);
  });

  it("falls back to defaultEnabled when api unavailable (no overrides, no userId)", () => {
    const flags = makeFlags({});
    expect(isFlagEnabled("test-default-true", undefined, undefined, flags)).toBe(true);
    expect(isFlagEnabled("test-flag", undefined, undefined, flags)).toBe(false);
  });

  it("does not crash with empty overrides array", () => {
    const flags = makeFlags({});
    expect(() => isFlagEnabled("test-flag", "user-1", [], flags)).not.toThrow();
  });

  it("rolloutPercentage with no userId returns default", () => {
    const flags = makeFlags({});
    expect(isFlagEnabled("test-rollout", undefined, [], flags)).toBe(false);
  });

  it("different bucketKey for same experiment changes allocation", () => {
    const users = Array.from({ length: 50 }, (_, i) => `user-${i}`);
    // Verify that bucket keys actually produce different hash values for the same user
    const bucketsKeyA = users.map((u) => djb2Hash(`${u}:bucket-key-a`) % 100);
    const bucketsKeyB = users.map((u) => djb2Hash(`${u}:bucket-key-b`) % 100);
    const different = bucketsKeyA.filter((_, i) => bucketsKeyA[i] !== bucketsKeyB[i]);
    expect(different.length).toBeGreaterThan(0);
  });
});
