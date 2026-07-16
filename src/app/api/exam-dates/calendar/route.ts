import { generateIcal, buildExportFilename } from "@/lib/exam-dates/calendar-export";
import { getExamDates, getSessionLabel } from "@/lib/exam-dates/service";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const session = url.searchParams.get("session") || "may-june";
  const yearStr = url.searchParams.get("year") || "2026";
  const year = Number.parseInt(yearStr, 10);

  const slots = await getExamDates(session, year);
  const sessionLabel = getSessionLabel(session, year);
  const ical = generateIcal(slots, sessionLabel);
  const filename = buildExportFilename(session, year);

  return new Response(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
