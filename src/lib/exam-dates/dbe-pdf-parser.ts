import { extractTextFromPdf } from "./pdf-text";
import type { ExamSlot } from "./types";
import { nanoid } from "nanoid";

export interface DbeParseWarning {
  line: number;
  message: string;
}

export interface DbeParseResult {
  slots: ExamSlot[];
  warnings: DbeParseWarning[];
  method: "text" | "ocr" | "mixed";
}

function isDbeDateLine(line: string): boolean {
  return /\d{2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i.test(line);
}

function isTimeLike(token: string): boolean {
  return /^(\d{2}):(\d{2})$/.test(token);
}

const SUBJECT_ABBR_MAP: Record<string, string> = {
  "eng hl": "English Home Language",
  "eng fal": "English First Additional Language",
  "eng sal": "English Second Additional Language",
  "afr hl": "Afrikaans Home Language",
  "afr fal": "Afrikaans First Additional Language",
  "afr sal": "Afrikaans Second Additional Language",
  "math": "Mathematics",
  "maths lit": "Mathematical Literacy",
  "phy": "Physical Sciences",
  "phys sci": "Physical Sciences",
  "life sci": "Life Sciences",
  "life ori": "Life Orientation",
  "acc": "Accounting",
  "bus stud": "Business Studies",
  "econ": "Economics",
  "geo": "Geography",
  "hist": "History",
  "cat": "Computer Applications Technology",
  "it": "Information Technology",
  "eng": "English",
  "afrik": "Afrikaans",
  "isizulu": "isiZulu",
  "isixhosa": "isiXhosa",
  "sepedi": "Sepedi",
  "sesotho": "Sesotho",
  "setswana": "Setswana",
  "siswati": "siSwati",
  "tshivenda": "Tshivenda",
  "xitsonga": "Xitsonga",
  "isindebele": "isiNdebele",
};

function normalizeSubject(subject: string): string {
  const lower = subject.toLowerCase().trim();
  return SUBJECT_ABBR_MAP[lower] ?? subject;
}

function extractPaperNumber(text: string): { subject: string; paper: number } {
  const match = text.match(/^(.*?)\s*(?:[-–]?\s*)?paper\s*(\d+)/i);
  if (match) {
    return { subject: match[1].trim(), paper: Number.parseInt(match[2], 10) };
  }
  const pMatch = text.match(/^(.*?)\s*(?:[-–]\s*)?p\s*(\d+)/i);
  if (pMatch) {
    return { subject: pMatch[1].trim(), paper: Number.parseInt(pMatch[2], 10) };
  }
  return { subject: text, paper: 1 };
}

function guessDuration(startTime: string, endTime: string): number {
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return Math.round(diff / 30) * 0.5;
}

function findLanguageInfo(tokens: string[]): string | undefined {
  const langs = new Set(["hl", "fal", "sal", "home language", "first additional", "second additional",
    "hl?", "fal?", "sal?"]);
  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (langs.has(lower.replace(/[^a-z]/g, ""))) {
      return lower;
    }
  }
  return undefined;
}

function parseDbeText(text: string, session: string, year: number): DbeParseResult {
  const warnings: DbeParseWarning[] = [];
  const slots: ExamSlot[] = [];
  const lines = text.split("\n").map((l, i) => ({ text: l, num: i + 1 }));

  let currentDate: string | null = null;

  for (const { text: line, num } of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (isDbeDateLine(trimmed)) {
      const dateMatch = trimmed.match(/(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})/i);
      if (dateMatch) {
        const months: Record<string, string> = {
          january: "01", february: "02", march: "03", april: "04",
          may: "05", june: "06", july: "07", august: "08",
          september: "09", october: "10", november: "11", december: "12",
        };
        const day = dateMatch[1].padStart(2, "0");
        const month = months[dateMatch[2].toLowerCase()] ?? "01";
        const yr = dateMatch[3];
        currentDate = `${yr}-${month}-${day}`;
      }
      continue;
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);
    const timeTokens = tokens.filter((t) => isTimeLike(t));

    if (timeTokens.length < 2 || !currentDate) continue;

    const timeIndex = tokens.findIndex((t) => isTimeLike(t));
    const nextTimeIndex = tokens.findIndex((t, i) => i > timeIndex && isTimeLike(t));

    if (timeIndex === -1 || nextTimeIndex === -1) continue;

    const startTime = tokens[timeIndex];
    const endTime = tokens[nextTimeIndex];

    const subjectTokens = tokens.slice(0, timeIndex).concat(tokens.slice(nextTimeIndex + 1));
    const combinedSubject = subjectTokens.join(" ");
    const { subject: rawSubject, paper } = extractPaperNumber(combinedSubject);
    const subject = normalizeSubject(rawSubject);
    const _lang = findLanguageInfo(subjectTokens);

    if (!subject) {
      warnings.push({ line: num, message: `Could not extract subject from: ${trimmed}` });
      continue;
    }

    const duration = guessDuration(startTime, endTime);

    slots.push({
      id: `dbe-${nanoid(8)}`,
      subject,
      subjectId: subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      paperNumber: paper,
      session: session as "may-june" | "oct-nov",
      year,
      date: currentDate,
      startTime,
      endTime,
      durationHours: duration || 3,
    });
  }

  if (slots.length === 0) {
    warnings.push({ line: 0, message: "No exam entries could be parsed from the text" });
  }

  return { slots, warnings, method: "text" };
}

export async function parseDbePdf(
  pdfBuffer: ArrayBuffer,
  session: string,
  year: number,
): Promise<DbeParseResult> {
  const buf = Buffer.from(pdfBuffer);

  const { text, pageCount } = await extractTextFromPdf(buf);

  if (text.trim().length > 50) {
    const result = parseDbeText(text, session, year);
    if (result.slots.length > 0) {
      return result;
    }
  }

  const { tryLocalOcr } = await import("@/lib/ocr/local-ocr");

  const ocrResults: string[] = [];
  for (let i = 0; i < Math.min(pageCount, 5); i++) {
    const imgBuffer = await extractPageAsImage(pdfBuffer, i);
    const ocrText = await tryLocalOcr(imgBuffer.toString("base64"));
    if (ocrText) ocrResults.push(ocrText);
  }

  if (ocrResults.length > 0) {
    const combined = ocrResults.join("\n--- Page Break ---\n");
    const result = parseDbeText(combined, session, year);
    result.method = ocrResults.length > 0 ? "ocr" : "text";
    if (result.slots.length > 0) return result;
  }

  const fullText = text || ocrResults.join("\n");
  return parseDbeText(fullText, session, year);
}

async function extractPageAsImage(_pdfBuffer: ArrayBuffer, _pageIndex: number): Promise<Buffer> {
  return Buffer.alloc(0);
}

export { parseDbeText as parseDbeTimetableText };
