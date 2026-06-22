import { createRouteHandler } from "@/lib/api/create-route-handler";
import { getSeedData, syncExamDatesToAppwrite } from "@/lib/exam-dates/service";
import type { ExamSlot } from "@/lib/exam-dates/types";

export const GET = createRouteHandler({
  auth: "none",
  errorLabel: "ExamDates",
  execute: async ({ req }) => {
    const url = new URL(req.url);
    const session = url.searchParams.get("session") || "may-june";
    const yearStr = url.searchParams.get("year") || "2026";
    const year = Number.parseInt(yearStr, 10);

    const slots: ExamSlot[] = getSeedData(session, year);

    return {
      slots,
      session,
      year,
      count: slots.length,
      updatedAt: new Date().toISOString(),
      source: "seed",
    };
  },
});

export const POST = createRouteHandler({
  auth: "required",
  errorLabel: "ExamDates",
  execute: async ({ req }) => {
    const url = new URL(req.url);
    const session = url.searchParams.get("session") || "may-june";
    const yearStr = url.searchParams.get("year") || "2026";
    const year = Number.parseInt(yearStr, 10);
    const body = (await req.json().catch(() => ({}))) as {
      slots?: ExamSlot[];
      syncAppwrite?: boolean;
    };

    if (body.slots && body.slots.length > 0) {
      if (body.syncAppwrite) {
        await syncExamDatesToAppwrite(session, year, body.slots);
      }
      return {
        success: true,
        session,
        year,
        count: body.slots.length,
      };
    }

    const slots = getSeedData(session, year);
    if (body.syncAppwrite && slots.length > 0) {
      await syncExamDatesToAppwrite(session, year, slots);
    }

    return {
      success: true,
      session,
      year,
      count: slots.length,
      source: "seed",
    };
  },
});
