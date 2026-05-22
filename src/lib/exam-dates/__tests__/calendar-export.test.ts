import { describe, expect, test } from "bun:test";
import type { ExamSlot } from "../types";

const { generateIcal, buildGoogleCalendarUrl, buildExportFilename } =
	await import("../calendar-export");

const mockSlots: ExamSlot[] = [
	{
		id: "test-1",
		subject: "Mathematics",
		subjectId: "mathematics",
		paperNumber: 1,
		session: "oct-nov",
		year: 2026,
		date: "2026-11-17",
		startTime: "09:00",
		endTime: "12:00",
		durationHours: 3,
	},
	{
		id: "test-2",
		subject: "English Home Language",
		subjectId: "english-home-language",
		paperNumber: 2,
		session: "oct-nov",
		year: 2026,
		date: "2026-11-13",
		startTime: "14:00",
		endTime: "17:00",
		durationHours: 3,
	},
];

describe("calendar-export", () => {
	test("generateIcal produces valid iCal format", () => {
		const ical = generateIcal(mockSlots, "Oct/Nov 2026");
		expect(ical).toStartWith("BEGIN:VCALENDAR");
		expect(ical).toEndWith("END:VCALENDAR");
		expect(ical).toContain("VERSION:2.0");
		expect(ical).toContain("BEGIN:VEVENT");
		expect(ical).toContain("END:VEVENT");
	});

	test("generateIcal includes exam details", () => {
		const ical = generateIcal(mockSlots, "Oct/Nov 2026");
		expect(ical).toContain("Mathematics Paper 1");
		expect(ical).toContain("English Home Language Paper 2");
	});

	test("generateIcal formats dates correctly", () => {
		const ical = generateIcal(mockSlots, "Oct/Nov 2026");
		expect(ical).toContain("DTSTART:20261117T090000");
		expect(ical).toContain("DTEND:20261117T120000");
	});

	test("buildGoogleCalendarUrl produces valid URL", () => {
		const url = buildGoogleCalendarUrl(mockSlots[0]);
		expect(url).toStartWith("https://calendar.google.com/calendar/render");
		expect(url).toContain("action=TEMPLATE");
		expect(url).toContain("Mathematics");
	});

	test("buildExportFilename generates correct name", () => {
		expect(buildExportFilename("may-june", 2026)).toContain("May-June");
		expect(buildExportFilename("oct-nov", 2026)).toContain("Oct-Nov");
		expect(buildExportFilename("may-june", 2026)).toEndWith(".ics");
	});
});
