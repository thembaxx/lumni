import { describe, expect, it } from "vitest";
import { getNavHierarchy, getPrimaryItems, getRouteLabel, navConfig } from "../config";

describe("navConfig", () => {
  it("has at least 5 categories", () => {
    expect(navConfig.length).toBeGreaterThanOrEqual(5);
  });

  it("every category has a label and items array", () => {
    for (const cat of navConfig) {
      expect(cat.label).toBeTruthy();
      expect(Array.isArray(cat.items)).toBe(true);
      expect(cat.items.length).toBeGreaterThan(0);
    }
  });

  it("every item has id, label, icon, and route", () => {
    for (const cat of navConfig) {
      for (const item of cat.items) {
        expect(item.id).toBeTruthy();
        expect(item.label).toBeTruthy();
        expect(item.icon).toBeDefined();
        expect(item.route).toMatch(/^\//);
      }
    }
  });

  it("no duplicate routes across categories", () => {
    const routes = navConfig.flatMap((c) => c.items.map((i) => i.route));
    const unique = new Set(routes);
    expect(unique.size).toBe(routes.length);
  });

  it("no duplicate ids across categories", () => {
    const ids = navConfig.flatMap((c) => c.items.map((i) => i.id));
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

describe("getPrimaryItems", () => {
  it("returns only items marked as primary", () => {
    const primary = getPrimaryItems();
    expect(primary.length).toBeGreaterThan(0);
    for (const item of primary) {
      expect(item.primary).toBe(true);
    }
  });

  it("includes quiz, problems, and chat as primary", () => {
    const primary = getPrimaryItems();
    const routes = primary.map((p) => p.route);
    expect(routes).toContain("/quiz");
    expect(routes).toContain("/problems");
    expect(routes).toContain("/chat");
  });
});

describe("getRouteLabel", () => {
  it("returns label for exact route match", () => {
    expect(getRouteLabel("/quiz")).toBe("Quiz");
    expect(getRouteLabel("/flashcards")).toBe("Flashcards");
    expect(getRouteLabel("/chat")).toBe("Chat");
  });

  it("returns label for nested routes", () => {
    expect(getRouteLabel("/quiz?subject=math")).toBe("Quiz");
    expect(getRouteLabel("/flashcards/active")).toBe("Flashcards");
  });

  it("returns undefined for unknown routes", () => {
    expect(getRouteLabel("/unknown-page")).toBeUndefined();
  });

  it("returns label for exam-dates", () => {
    expect(getRouteLabel("/exam-dates")).toBe("Exam Dates");
  });

  it("returns undefined for /dashboard (not in navConfig)", () => {
    expect(getRouteLabel("/dashboard")).toBeUndefined();
  });
});

describe("getNavHierarchy", () => {
  it("returns an object with / and /dashboard", () => {
    const h = getNavHierarchy();
    expect(h["/"]).toBe(0);
    expect(h["/dashboard"]).toBe(0);
  });
});
