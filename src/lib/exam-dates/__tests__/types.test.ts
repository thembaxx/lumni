import { describe, expect, test } from "bun:test";
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
		expect(slot.id).toBeString();
		expect(slot.subject).toBeString();
		expect(slot.subjectId).toBeString();
		expect(slot.paperNumber).toBeNumber();
		expect(["may-june", "oct-nov"]).toContain(slot.session);
		expect(slot.year).toBeNumber();
		expect(slot.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
		expect(slot.startTime).toMatch(/^\d{2}:\d{2}$/);
		expect(slot.endTime).toMatch(/^\d{2}:\d{2}$/);
		expect(slot.durationHours).toBeNumber();
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
		expect(collection.id).toBeString();
		expect(collection.session).toBeString();
		expect(collection.year).toBeNumber();
		expect(Array.isArray(collection.slots)).toBeTrue();
		expect(collection.source).toBeOneOf(["seed", "scraper", "admin"]);
	});
});
