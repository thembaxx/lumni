import { createRouteHandler } from "@/lib/api/create-route-handler";
import { parseDbePdf } from "@/lib/exam-dates/dbe-pdf-parser";
import { parseTextTimetable } from "@/lib/exam-dates/text-timetable-parser";
import { dexieDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

interface IngestBody {
  pdfBase64?: string;
  text?: string;
  session: string;
  year: number;
}

export const POST = createRouteHandler({
  auth: "optional",
  errorLabel: "ExamDatesIngest",
  parseBody: async (req) => {
    const ct = req.headers.get("content-type") ?? "";
    if (ct.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File | null;
      const session = (form.get("session") as string) ?? "may-june";
      const yearStr = (form.get("year") as string) ?? "2026";
      const year = Number.parseInt(yearStr, 10);

      if (file) {
        const buf = await file.arrayBuffer();
        const pdfBase64 = Buffer.from(buf).toString("base64");
        return { pdfBase64, session, year } as IngestBody;
      }
      return { session, year, text: form.get("text") as string } as IngestBody;
    }
    return (await req.json()) as IngestBody;
  },
  validate: (body) => {
    if (!["may-june", "oct-nov"].includes(body.session)) {
      return 'session must be "may-june" or "oct-nov"';
    }
    if (!Number.isInteger(body.year) || body.year < 2020 || body.year > 2030) {
      return "year must be an integer between 2020 and 2030";
    }
    if (!body.pdfBase64 && !body.text) {
      return "Provide either pdfBase64 or text";
    }
    if (body.pdfBase64 && typeof body.pdfBase64 !== "string") {
      return "pdfBase64 must be a string";
    }
    if (body.text && typeof body.text !== "string") {
      return "text must be a string";
    }
    return null;
  },
  execute: async ({ body: { pdfBase64, text, session, year } }) => {
    if (pdfBase64) {
      const buf = Buffer.from(pdfBase64, "base64");
      const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
      const result = await parseDbePdf(ab, session, year);

      if (result.slots.length > 0) {
        try {
          const key = `${session}_${year}`;
          await dexieDataAccess.examDates.put({
            cacheKey: key,
            session,
            year,
            slots: JSON.stringify(result.slots),
            updatedAt: Date.now(),
          });
        } catch (e) {
          logError("ExamDatesIngest.WriteCache", e);
        }
      }

      return {
        success: result.slots.length > 0,
        slots: result.slots,
        warnings: result.warnings,
        count: result.slots.length,
        session,
        year,
        method: result.method,
        isPreview: true,
      };
    }

    if (text) {
      const result = parseTextTimetable(text, session, year);

      return {
        success: result.slots.length > 0,
        slots: result.slots,
        warnings: result.warnings,
        count: result.slots.length,
        session,
        year,
        method: "text",
        isPreview: true,
      };
    }

    return {
      success: false,
      slots: [],
      warnings: [{ line: 0, message: "No input provided" }],
      count: 0,
      session,
      year,
    };
  },
});
