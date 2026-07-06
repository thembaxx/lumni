import { describe, expect, test } from "vitest";

function parseCsv(text: string): { rows: Array<{ studentName: string; studentEmail: string; grade?: string; subject?: string }>; errors: Array<{ row: number; message: string }> } {
  const lines = text.trim().split("\n");
  if (lines.length < 2) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV must have a header row and at least one data row" }],
    };
  }

  const header = lines[0].toLowerCase().trim().split(",").map((h) => h.trim());
  const nameIdx = header.indexOf("student_name");
  const emailIdx = header.indexOf("student_email");
  const gradeIdx = header.indexOf("grade");
  const subjectIdx = header.indexOf("subject");

  if (nameIdx === -1 || emailIdx === -1) {
    return {
      rows: [],
      errors: [{ row: 1, message: "CSV must have 'student_name' and 'student_email' columns" }],
    };
  }

  const rows: Array<{ studentName: string; studentEmail: string; grade?: string; subject?: string }> = [];
  const errors: Array<{ row: number; message: string }> = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].trim().split(",").map((c) => c.trim());
    const email = cols[emailIdx] || "";
    if (!email) {
      errors.push({ row: i + 1, message: "Missing student_email" });
      continue;
    }
    rows.push({
      studentName: cols[nameIdx] || "Unknown",
      studentEmail: email,
      grade: gradeIdx >= 0 ? cols[gradeIdx] : undefined,
      subject: subjectIdx >= 0 ? cols[subjectIdx] : undefined,
    });
  }

  return { rows, errors };
}

describe("Roster CSV parser", () => {
  test("parses valid CSV with header + 2 data rows", () => {
    const csv = "student_name,student_email\nJohn Doe,john@test.com\nJane Doe,jane@test.com";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.rows[0].studentName).toBe("John Doe");
    expect(result.rows[0].studentEmail).toBe("john@test.com");
    expect(result.rows[1].studentName).toBe("Jane Doe");
    expect(result.rows[1].studentEmail).toBe("jane@test.com");
  });

  test("returns error when missing required columns", () => {
    const csv = "name,email\nJohn,john@test.com";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("student_name");
  });

  test("returns error when CSV has no data (header only)", () => {
    const csv = "student_name,student_email";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain("at least one data row");
  });

  test("handles empty email gracefully", () => {
    const csv = "student_name,student_email\nJohn,";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(0);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toBe("Missing student_email");
  });

  test("extracts grade and subject columns when present", () => {
    const csv = "student_name,student_email,grade,subject\nJohn Doe,john@test.com,10,Mathematics";
    const result = parseCsv(csv);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].grade).toBe("10");
    expect(result.rows[0].subject).toBe("Mathematics");
  });
});
