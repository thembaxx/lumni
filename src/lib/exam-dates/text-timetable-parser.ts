import { nanoid } from "nanoid";
import type { ExamSlot } from "./types";

export interface TextTimetableWarning {
  line: number;
  message: string;
}

export interface TextTimetableResult {
  slots: ExamSlot[];
  warnings: TextTimetableWarning[];
}

const DATE_FORMATS = [
  /^(\d{4})-(\d{2})-(\d{2})$/,
  /^(\d{2})\/(\d{2})\/(\d{4})$/,
  /^(\d{4})(\d{2})(\d{2})$/,
];

function parseDate(raw: string): string | null {
  for (const re of DATE_FORMATS) {
    const m = raw.match(re);
    if (m) {
      if (m[1].length === 4) {
        return `${m[1]}-${m[2]}-${m[3]}`;
      }
      return `${m[3]}-${m[1]}-${m[2]}`;
    }
  }
  return null;
}

const TIME_RE = /^(\d{2}):(\d{2})$/;

function isTime(token: string): boolean {
  return TIME_RE.test(token);
}

function extractPaper(subject: string): { cleaned: string; paper: number } {
  const m = subject.match(/^(.*?)\s+(?:Paper|P)\s*(\d+)\s*$/i);
  if (m) {
    return { cleaned: m[1].trim(), paper: Number.parseInt(m[2], 10) };
  }
  const m2 = subject.match(/^(.*?)\s+Paper\s*(\d+)\s*[-–]\s*(.+)$/i);
  if (m2) {
    return { cleaned: `${m2[1].trim()} ${m2[3].trim()}`, paper: Number.parseInt(m2[2], 10) };
  }
  return { cleaned: subject, paper: 1 };
}

function inferEndTime(start: string, durationHours: number): string {
  const [h, m] = start.split(":").map(Number);
  const totalMinutes = h * 60 + m + durationHours * 60;
  const endH = Math.floor(totalMinutes / 60) % 24;
  const endM = totalMinutes % 60;
  return `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;
}

export function parseTextTimetable(
  text: string,
  session: string,
  year: number,
): TextTimetableResult {
  const warnings: TextTimetableWarning[] = [];
  const slots: ExamSlot[] = [];

  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const stripped = raw.split("#")[0].trim();
    if (!stripped) continue;

    const dateStr = parseDate(stripped);
    if (!dateStr) {
      warnings.push({ line: i + 1, message: `Unrecognised date format: "${stripped}"` });
      continue;
    }

    const afterDate = stripped.replace(/^[^\s]+\s*/, "");
    const tokens = afterDate.split(/\s+/).filter(Boolean);

    const timeIdx = tokens.findIndex((t) => isTime(t));
    if (timeIdx === -1) {
      warnings.push({ line: i + 1, message: `Missing time on line: "${raw.trim()}"` });
      continue;
    }

    const startTime = tokens[timeIdx];
    const subjectTokens = tokens.slice(0, timeIdx).concat(tokens.slice(timeIdx + 1));
    const subjectRaw = subjectTokens.join(" ");

    const { cleaned: subject, paper } = extractPaper(subjectRaw);

    if (!subject) {
      warnings.push({ line: i + 1, message: `Could not extract subject from: "${raw.trim()}"` });
      continue;
    }

    const finalYear = dateStr.slice(0, 4);
    const parsedYear = Number.parseInt(finalYear, 10);

    slots.push({
      id: `text-${nanoid(8)}`,
      subject,
      subjectId: subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      paperNumber: paper,
      session: session as "may-june" | "oct-nov",
      year: Number.isNaN(parsedYear) ? year : parsedYear,
      date: dateStr,
      startTime,
      endTime: inferEndTime(startTime, 3),
      durationHours: 3,
    });
  }

  return { slots, warnings };
}
