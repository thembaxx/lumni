import { describe, expect, test } from "vitest";
import { parseDbeTimetableText } from "../dbe-pdf-parser";

const SAMPLE_TIMETABLE = `NATIONAL SENIOR CERTIFICATE
EXAMINATION TIMETABLE: NOVEMBER 2026

10 November 2026
09:00 12:00 Mathematics Paper 1
14:00 16:30 English Home Language Paper 1

12 November 2026
09:00 12:00 Physical Sciences Paper 1
14:00 16:30 Life Sciences Paper 1

17 November 2026
09:00 11:30 Mathematics Paper 2
14:00 16:00 Geography Paper 1`;

describe("parseDbeTimetableText", () => {
  test("parses standard DBE timetable text", () => {
    const result = parseDbeTimetableText(SAMPLE_TIMETABLE, "November", 2026);
    expect(result.slots.length).toBe(6);
    expect(result.method).toBe("text");
    expect(result.slots[0].subject).toBe("Mathematics");
    expect(result.slots[0].paperNumber).toBe(1);
    expect(result.slots[0].session).toBe("November");
    expect(result.slots[0].date).toContain("2026-11-10");
  });

  test("handles empty text", () => {
    const result = parseDbeTimetableText("", "November", 2026);
    expect(result.slots.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test("extracts paper numbers from names", () => {
    const text = "10 November 2026\n09:00 12:00 Mathematics Paper 2";
    const result = parseDbeTimetableText(text, "November", 2026);
    expect(result.slots[0].paperNumber).toBe(2);
  });

  test("handles date format: DD Month YYYY", () => {
    const text = "17 November 2026\n09:00 11:30 Mathematics Paper 1";
    const result = parseDbeTimetableText(text, "November", 2026);
    expect(result.slots[0].date).toMatch(/2026-11-17/);
  });

  test("returns warnings for unparseable input", () => {
    const text = "some random unparseable text without dates";
    const result = parseDbeTimetableText(text, "November", 2026);
    expect(result.slots.length).toBe(0);
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  test("parses subject abbreviations like eng hl", () => {
    const text = "10 November 2026\n09:00 12:00 Eng HL Paper 1";
    const result = parseDbeTimetableText(text, "November", 2026);
    expect(result.slots.length).toBe(1);
    expect(result.slots[0].subject).toBe("English Home Language");
  });
});
