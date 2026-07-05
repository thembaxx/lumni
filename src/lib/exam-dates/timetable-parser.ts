import { getAI } from "@/lib/ai/client";
import type { ExamSlot } from "./types";

export interface TimetableParseResult {
  slots: ExamSlot[];
  error?: string;
}

const SYSTEM_PROMPT = `You are a South African exam timetable parser. Convert raw timetable text into structured JSON.

Rules:
- Each exam entry must have: subject (full name), subjectId (kebab-case slug), paperNumber (integer), date (YYYY-MM-DD), startTime (HH:MM), endTime (HH:MM), durationHours (number).
- session is either "may-june" or "oct-nov".
- year is the 4-digit year.
- If the timetable shows "SC" or "Senior Certificate" markings, set isSC: true.
- Derive durationHours from startTime and endTime if not explicitly given.
- Map common subject abbreviations to full names (e.g. "Eng HL" → "English Home Language", "Afrik SAL" → "Afrikaans Second Additional Language").
- subjectId should be lowercase kebab-case (e.g. "english-home-language", "mathematics", "physical-sciences").

Respond ONLY with a valid JSON array. No markdown fences, no extra text.`;

function extractJsonFromResponse(raw: string): string {
  const jsonMatch = raw.match(/\[[\s\S]*\]/);
  if (jsonMatch) return jsonMatch[0];
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) return objMatch[0];
  return raw;
}

export async function parseTimetableOcr(
  ocrText: string,
  session: string,
  year: number,
): Promise<TimetableParseResult> {
  try {
    const ai = getAI();

    const userPrompt = `Parse the following South African exam timetable into structured exam slot data.

Session: ${session}
Year: ${year}

Timetable text:
${ocrText}

Return a JSON array of exam slots.`;

    const result = await ai.generateWithSystem(SYSTEM_PROMPT, userPrompt, {
      temperature: 0.1,
      maxOutputTokens: 8192,
    });

    if (result.type === "failure") {
      return { slots: [], error: result.error };
    }

    const cleaned = extractJsonFromResponse(result.content);
    const parsed = JSON.parse(cleaned);

    const rawSlots = Array.isArray(parsed) ? parsed : (parsed.slots ?? []);

    const slots: ExamSlot[] = rawSlots.map(
      (s: Record<string, unknown>, i: number): ExamSlot => ({
        id: `${session}-${String(year)}-parsed-${i + 1}`,
        subject: String(s.subject ?? ""),
        subjectId: String(s.subjectId ?? ""),
        paperNumber: Number(s.paperNumber) || 1,
        session: session as "may-june" | "oct-nov",
        year,
        date: String(s.date ?? ""),
        startTime: String(s.startTime ?? ""),
        endTime: String(s.endTime ?? ""),
        durationHours: Number(s.durationHours) || 0,
        isSC: Boolean(s.isSC),
      }),
    );

    if (slots.length === 0) {
      return { slots: [], error: "No exam slots could be parsed from the timetable" };
    }

    return { slots };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { slots: [], error: `Failed to parse timetable: ${message}` };
  }
}
