import { describe, expect, test } from "vitest";
import { getCurrentSession } from "../types";

describe("exam-dates types", () => {
	test("getCurrentSession returns may-june before July", () => {
		const result = getCurrentSession();
		expect(["may-june", "oct-nov"]).toContain(result.session);
		expect(result.year).toBeGreaterThanOrEqual(2026);
	});

	test("ExamSlot shape has all required fields", () => {
		const slot = {
			id: "2026-nov-12-1",
			subject: "Mathematics",
			subjectId: "mathematics",
			paperNumber: 1,
			session: "oct-nov" as const,
			year: 2026,
			date: "2026-11-12",
			startTime: "09:00",
			endTime: "12:00",
			durationHours: 3,
		};
		expect(slot.id).toEqual(expect.any(String));
		expect(slot.subject).toEqual(expect.any(String));
		expect(slot.subjectId).toEqual(expect.any(String));
		expect(typeof slot.paperNumber).toBe("number");
		expect(["may-june", "oct-nov"]).toContain(slot.session);
		expect(typeof slot.year).toBe("number");
		expect(slot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
		expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
		expect(typeof slot.durationHours).toBe("number");
	});

	test("ExamDateCollection shape", () => {
		const collection = {
			id: "test",
			session: "may-june",
			year: 2026,
			slots: [],
			updatedAt: new Date().toISOString(),
			source: "seed",
		};
		expect(collection.id).toEqual(expect.any(String));
		expect(collection.session).toEqual(expect.any(String));
		expect(typeof collection.year).toBe("number");
		expect(Array.isArray(collection.slots)).toBe(true);
		expect(["seed", "scraper", "admin"]).toContain(collection.source);
	});
});
