import { createRouteHandler } from "@/lib/api/create-route-handler";
import { storeResults } from "@/lib/matric-results";
import type { MatricResult } from "@/lib/db/schema";

function parseMatricCsv(text: string): {
  rows: MatricResult[];
  errors: { row: number; message: string }[];
} {
  const lines = text.trim().split("\n");
  const errors: { row: number; message: string }[] = [];
  const rows: MatricResult[] = [];

  if (lines.length < 2) {
    errors.push({ row: 1, message: "CSV must have a header row and at least one data row" });
    return { rows, errors };
  }

  const header = lines[0]
    .toLowerCase()
    .trim()
    .split(",")
    .map((h) => h.trim());

  const colMap = new Map<string, number>();
  const requiredCols = [
    "candidatenumber",
    "firstname",
    "lastname",
    "examyear",
    "session",
    "subject",
    "mark",
    "outof",
    "level",
  ];
  for (const [i, h] of header.entries()) {
    colMap.set(h.replace(/\s+/g, ""), i);
  }

  for (const col of requiredCols) {
    if (!colMap.has(col)) {
      errors.push({ row: 1, message: `Missing required column: ${col}` });
      return { rows, errors };
    }
  }

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i]
      .trim()
      .split(",")
      .map((c) => c.trim());
    const get = (name: string) => cols[colMap.get(name)!] ?? "";

    const candidateNumber = get("candidatenumber");
    if (!candidateNumber) {
      errors.push({ row: i + 1, message: "Missing candidateNumber" });
      continue;
    }

    const firstName = get("firstname");
    const lastName = get("lastname");
    const examYear = Number.parseInt(get("examyear"), 10);
    const session = get("session");
    const subject = get("subject");
    const mark = Number.parseInt(get("mark"), 10);
    const outOf = Number.parseInt(get("outof"), 10);
    const level = Number.parseInt(get("level"), 10);

    if (!firstName || !lastName) {
      errors.push({ row: i + 1, message: `Missing firstName/lastName for ${candidateNumber}` });
      continue;
    }

    if (Number.isNaN(examYear) || examYear < 2000 || examYear > 2100) {
      errors.push({ row: i + 1, message: `Invalid examYear for ${candidateNumber}` });
      continue;
    }

    if (!session) {
      errors.push({ row: i + 1, message: `Missing session for ${candidateNumber}` });
      continue;
    }

    if (!subject) {
      errors.push({ row: i + 1, message: `Missing subject for ${candidateNumber}` });
      continue;
    }

    if (Number.isNaN(mark) || mark < 0) {
      errors.push({ row: i + 1, message: `Invalid mark for ${candidateNumber}` });
      continue;
    }

    if (Number.isNaN(outOf) || outOf <= 0) {
      errors.push({ row: i + 1, message: `Invalid outOf for ${candidateNumber}` });
      continue;
    }

    if (mark > outOf) {
      errors.push({ row: i + 1, message: `mark exceeds outOf for ${candidateNumber}` });
      continue;
    }

    if (Number.isNaN(level) || level < 1 || level > 7) {
      errors.push({ row: i + 1, message: `Invalid level (must be 1-7) for ${candidateNumber}` });
      continue;
    }

    let achievement: string;
    if (level >= 6) achievement = "outstanding";
    else if (level >= 4) achievement = "achieved";
    else if (level >= 3) achievement = "partially-achieved";
    else achievement = "not-achieved";

    rows.push({
      candidateNumber,
      firstName,
      lastName,
      examYear,
      examSession: session,
      subject,
      subjectCode: get("subjectcode") || undefined,
      paperNumber: get("papernumber") ? Number.parseInt(get("papernumber"), 10) : undefined,
      mark,
      outOf,
      level,
      achievement,
      schoolName: get("schoolname") || undefined,
      centreNumber: get("centrenumber") || undefined,
    });
  }

  return { rows, errors };
}

export const POST = createRouteHandler({
  auth: "admin",
  useRateLimit: true,
  errorLabel: "MatricUpload",
  parseBody: async (req) => {
    const formData = await req.formData();
    const file = formData.get("file");
    if (file instanceof Blob) {
      return { csvText: await file.text() } as Record<string, unknown>;
    }
    const csvText = formData.get("csvText");
    return { csvText: (csvText as string) ?? "" } as Record<string, unknown>;
  },
  validate: (body) => {
    const b = body as { csvText?: string };
    if (!b.csvText || typeof b.csvText !== "string") return "csvText or file required";
    return null;
  },
  execute: async ({ body }) => {
    const { csvText } = body as { csvText: string };
    const { rows, errors: parseErrors } = parseMatricCsv(csvText);

    if (parseErrors.length > 0) {
      return { inserted: 0, errors: parseErrors.length, errorRows: parseErrors };
    }

    if (rows.length === 0) {
      return { inserted: 0, errors: 0, errorRows: [] };
    }

    const inserted = storeResults(rows);

    return { inserted, errors: 0, errorRows: [] };
  },
});
