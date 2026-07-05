import { createRouteHandler } from "@/lib/api/create-route-handler";
import { extractTextFromPdf } from "@/lib/exam-dates/pdf-text";
import { syncExamDatesToAppwrite } from "@/lib/exam-dates/service";
import { parseTimetableOcr } from "@/lib/exam-dates/timetable-parser";
import { logError } from "@/lib/shared/logger";
import { dexieDataAccess } from "@/lib/db";

interface ScrapeBody {
  pdfBase64: string;
  session: string;
  year: number;
}

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ExamDatesScrape",
  parseBody: async (req) => {
    const body = (await req.json()) as ScrapeBody;
    return body;
  },
  validate: (body: ScrapeBody) => {
    if (!body.pdfBase64 || typeof body.pdfBase64 !== "string") {
      return "pdfBase64 is required";
    }
    if (!["may-june", "oct-nov"].includes(body.session)) {
      return 'session must be "may-june" or "oct-nov"';
    }
    if (!Number.isInteger(body.year) || body.year < 2020 || body.year > 2030) {
      return "year must be an integer between 2020 and 2030";
    }
    return null;
  },
  execute: async ({ body: { pdfBase64, session, year } }) => {
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const { text, pageCount } = await extractTextFromPdf(pdfBuffer);

    if (!text.trim()) {
      return {
        success: false,
        error: "No text could be extracted from the PDF. The file may be a scanned image.",
        slots: [],
        pageCount,
      };
    }

    const { slots, error: parseError } = await parseTimetableOcr(text, session, year);

    if (parseError || slots.length === 0) {
      return {
        success: false,
        error: parseError ?? "No exam slots could be parsed",
        slots: [],
        pageCount,
      };
    }

    const cacheKey = `${session}_${year}`;

    try {
      await dexieDataAccess.examDates.put({
        cacheKey,
        session,
        year,
        slots: JSON.stringify(slots),
        updatedAt: Date.now(),
      });
    } catch (e) {
      logError("ExamDatesScrape.WriteCache", e);
    }

    try {
      await syncExamDatesToAppwrite(session, year, slots);
    } catch (e) {
      logError("ExamDatesScrape.SyncAppwrite", e);
    }

    return {
      success: true,
      slots,
      count: slots.length,
      session,
      year,
      pageCount,
      source: "scrape",
    };
  },
});
