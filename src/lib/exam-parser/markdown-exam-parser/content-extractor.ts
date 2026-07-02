import type { ContentBlock, DataTable, Option, QuestionType } from "@/types/exam-paper";

export function cleanText(text: string): string {
  return text
    .replace(/<br\s*\/?>/g, " ")
    .replace(/\|+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractMarks(text: string): number | string | null {
  let m = text.match(/\((\d+)\s*x\s*(\d+)\)\s*\((\d+)\)$/);
  if (m) return `(${m[1]} x ${m[2]}) (${m[3]})`;
  m = text.match(/\((\d+)\s*x\s*(\d+)\)/);
  if (m) return `(${m[1]} x ${m[2]})`;
  m = text.match(/\((\d+)\)$/);
  if (m) return parseInt(m[1], 10);
  return null;
}

export function removeMarks(text: string): string {
  text = text.replace(/\(\d+\s*x\s*\d+\)\s*\(\d+\)$/, "");
  text = text.replace(/\(\d+\s*x\s*\d+\)$/, "");
  text = text.replace(/\(\d+\)$/, "");
  return text.trim();
}

export function extractTable(lines: string[], start: number): DataTable | null {
  const headers: string[] = [];
  const rows: (string | number | null)[][] = [];
  let foundHeader = false;
  for (let i = start; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith("|")) break;
    if (/^\|[-\s|:]+\|$/.test(line)) {
      foundHeader = true;
      continue;
    }
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => {
        const cell = c
          .trim()
          .replace(/<br\s*\/?>/g, "\n")
          .replace(/\s+/g, " ");
        const num = Number(cell);
        if (!Number.isNaN(num) && cell.trim() !== "") return num;
        return cell;
      });
    if (!foundHeader && headers.length === 0) headers.push(...cells.map(String));
    else if (foundHeader || headers.length > 0) rows.push(cells);
  }
  if (headers.length > 0) return { headers, rows };
  return null;
}

export function tableEnd(lines: string[], start: number): number {
  for (let i = start; i < lines.length; i++) {
    if (!lines[i].trim().startsWith("|")) return i;
  }
  return lines.length;
}

export function extractCodeBlock(lines: string[], start: number): ContentBlock | null {
  const line = lines[start].trim();
  const lang = line.slice(3).trim() || undefined;
  const codeLines: string[] = [];
  let i = start + 1;
  while (i < lines.length) {
    if (lines[i].trim().startsWith("```")) break;
    codeLines.push(lines[i]);
    i++;
  }
  if (codeLines.length === 0) return null;
  return {
    type: "code",
    value: codeLines.join("\n"),
    language: lang,
  };
}

export function findCodeEnd(lines: string[], start: number): number {
  for (let i = start + 1; i < lines.length; i++) {
    if (lines[i].trim().startsWith("```")) return i + 1;
  }
  return lines.length;
}

export function extractFormula(lines: string[], start: number): ContentBlock | null {
  const formulaLines: string[] = [];
  let i = start + 1;
  while (i < lines.length) {
    if (lines[i].trim().startsWith("$$")) break;
    formulaLines.push(lines[i]);
    i++;
  }
  if (formulaLines.length === 0) return null;
  return {
    type: "formula",
    value: formulaLines.join("\n").trim(),
  };
}

export function determineType(
  text: string,
  options: Option[],
  table: DataTable | null,
): QuestionType {
  const lower = (text || "").toLowerCase();
  if (options.length > 0) return "multiple-choice";
  if (table && /column|match/.test(lower)) return "matching";
  if (/essay|paragraph/.test(lower)) return "essay";
  if (/source/.test(lower)) return "source-based";
  if (/calculate|formula|compute|determine|gradient/.test(lower)) return "calculation";
  if (/draw|diagram|sketch/.test(lower)) return "diagram";
  if (/write code|program|delphi/.test(lower)) return "programming";
  if (/tabulate/.test(lower)) return "data-response";
  return "short-answer";
}

export function determineAnswerFormat(
  type: QuestionType,
  _options: Option[],
  _table: DataTable | null,
): string | null {
  switch (type) {
    case "multiple-choice":
      return "single-select";
    case "matching":
      return "dropdown-pairs";
    case "short-answer":
      return "free-text";
    case "long-answer":
      return "free-text-long";
    case "essay":
      return "free-text-essay";
    case "calculation":
      return "numeric";
    case "diagram":
      return "drawing-or-upload";
    case "source-based":
      return "source-response";
    case "programming":
      return "code";
    case "data-response":
      return "data-response";
    case "mixed":
      return "composite";
    default:
      return null;
  }
}
