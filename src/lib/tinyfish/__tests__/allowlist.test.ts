import { describe, expect, test } from "vitest";
import {
  BLOCKED_DOMAINS,
  isDomainBlocked,
  isSubjectAllowed,
  MAX_SOURCE_CONTENT_CHARS,
  MIN_CONTENT_LENGTH,
  PER_USER_DAILY_LIMIT,
} from "../allowlist";

describe("isSubjectAllowed", () => {
  test("returns true for core matric STEM subjects", () => {
    expect(isSubjectAllowed("mathematics")).toBe(true);
    expect(isSubjectAllowed("physical-sciences")).toBe(true);
    expect(isSubjectAllowed("life-sciences")).toBe(true);
  });

  test("returns true for matric humanities", () => {
    expect(isSubjectAllowed("history")).toBe(true);
    expect(isSubjectAllowed("geography")).toBe(true);
    expect(isSubjectAllowed("accounting")).toBe(true);
  });

  test("returns true for matric languages", () => {
    expect(isSubjectAllowed("english-home-language")).toBe(true);
    expect(isSubjectAllowed("afrikaans-home-language")).toBe(true);
    expect(isSubjectAllowed("isi-zulu-home-language")).toBe(true);
  });

  test("returns false for off-grid subjects", () => {
    expect(isSubjectAllowed("life-orientation")).toBe(false);
    expect(isSubjectAllowed("computer-applications-technology")).toBe(false);
    expect(isSubjectAllowed("visual-arts")).toBe(false);
    expect(isSubjectAllowed("music")).toBe(false);
  });

  test("returns false for null/undefined/empty", () => {
    expect(isSubjectAllowed(null)).toBe(false);
    expect(isSubjectAllowed(undefined)).toBe(false);
    expect(isSubjectAllowed("")).toBe(false);
  });

  test("returns false for unknown subject", () => {
    expect(isSubjectAllowed("random-thing")).toBe(false);
  });

  test("case sensitive", () => {
    expect(isSubjectAllowed("Mathematics")).toBe(false);
  });
});

describe("isDomainBlocked", () => {
  test("blocks social media domains", () => {
    expect(isDomainBlocked("https://pinterest.com/pin/123")).toBe(true);
    expect(isDomainBlocked("https://www.reddit.com/r/test")).toBe(true);
    expect(isDomainBlocked("https://x.com/foo")).toBe(true);
    expect(isDomainBlocked("https://twitter.com/foo")).toBe(true);
    expect(isDomainBlocked("https://facebook.com/x")).toBe(true);
    expect(isDomainBlocked("https://www.instagram.com/x")).toBe(true);
    expect(isDomainBlocked("https://tiktok.com/@x")).toBe(true);
    expect(isDomainBlocked("https://www.youtube.com/watch?v=x")).toBe(true);
    expect(isDomainBlocked("https://quora.com/q")).toBe(true);
  });

  test("blocks subdomains of blocked domains", () => {
    expect(isDomainBlocked("https://m.reddit.com/r/test")).toBe(true);
    expect(isDomainBlocked("https://en.reddit.com/r/test")).toBe(true);
  });

  test("does NOT block educational domains", () => {
    expect(isDomainBlocked("https://www.education.gov.za/curriculum")).toBe(false);
    expect(isDomainBlocked("https://en.wikipedia.org/wiki/Photosynthesis")).toBe(false);
    expect(isDomainBlocked("https://www.sahistory.org.za/")).toBe(false);
  });

  test("does NOT block substring matches", () => {
    expect(isDomainBlocked("https://notpinterest.com/x")).toBe(false);
    expect(isDomainBlocked("https://pinterest-clone.com/")).toBe(false);
  });

  test("returns true for invalid URLs", () => {
    expect(isDomainBlocked("not a url")).toBe(true);
    expect(isDomainBlocked("")).toBe(true);
  });

  test("BLOCKED_DOMAINS list is non-empty", () => {
    expect(BLOCKED_DOMAINS.length).toBeGreaterThan(0);
  });
});

describe("constants", () => {
  test("MIN_CONTENT_LENGTH is a positive number", () => {
    expect(MIN_CONTENT_LENGTH).toBeGreaterThan(0);
  });

  test("MAX_SOURCE_CONTENT_CHARS is reasonable", () => {
    expect(MAX_SOURCE_CONTENT_CHARS).toBeGreaterThanOrEqual(500);
    expect(MAX_SOURCE_CONTENT_CHARS).toBeLessThanOrEqual(5000);
  });

  test("PER_USER_DAILY_LIMIT matches AI gen budget (20)", () => {
    expect(PER_USER_DAILY_LIMIT).toBe(20);
  });
});
