import { describe, expect, test } from "bun:test";

describe("exam-dates service", () => {
	test("getSessionLabel formats may-june", async () => {
		const { getSessionLabel } = await import("../service");
		expect(getSessionLabel("may-june", 2026)).toBe("May/June 2026");
	});

	test("getSessionLabel formats oct-nov", async () => {
		const { getSessionLabel } = await import("../service");
		expect(getSessionLabel("oct-nov", 2026)).toBe("Oct/Nov 2026");
	});

	test("getSeedData returns slots for known session", async () => {
		const { getSeedData } = await import("../service");
		const slots = getSeedData("may-june", 2026);
		expect(slots.length).toBeGreaterThan(0);
		expect(slots[0]).toHaveProperty("id");
		expect(slots[0]).toHaveProperty("subject");
	});

	test("getSeedData returns empty for unknown session", async () => {
		const { getSeedData } = await import("../service");
		const slots = getSeedData("may-june", 2025);
		expect(slots).toEqual([]);
	});

	test("getSeedData returns oct-nov 2026 slots", async () => {
		const { getSeedData } = await import("../service");
		const slots = getSeedData("oct-nov", 2026);
		expect(slots.length).toBeGreaterThan(0);
		expect(slots[0].session).toBe("oct-nov");
	});

	test("formatFriendlyDate formats correctly", async () => {
		const { formatFriendlyDate } = await import("../service");
		const result = formatFriendlyDate("2026-11-17");
		expect(result).toContain("2026");
	});

	test("formatTimeRange formats correctly", async () => {
		const { formatTimeRange } = await import("../service");
		expect(formatTimeRange("09:00", "12:00")).toBe("09:00–12:00");
	});

	test("formatDuration handles various lengths", async () => {
		const { formatDuration } = await import("../service");
		expect(formatDuration(1)).toBe("1 hour");
		expect(formatDuration(1.5)).toBe("1h 30m");
		expect(formatDuration(2)).toBe("2 hours");
		expect(formatDuration(2.5)).toBe("2h 30m");
		expect(formatDuration(3)).toBe("3 hours");
		expect(formatDuration(4)).toBe("4h");
	});

	test("re-exports getSubjectAbbr and getSubjectColor", async () => {
		const mod = await import("../service");
		expect(mod.getSubjectAbbr).toBeFunction();
		expect(mod.getSubjectColor).toBeFunction();
	});
});
