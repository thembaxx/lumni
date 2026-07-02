import type { PaperMetadata } from "@/types/exam-paper";
import { cleanText } from "./content-extractor";

function extractExamPeriod(header: string): string | null {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const monthPattern = months.join("|");
  const m = header.match(new RegExp(`(${monthPattern})\\s*(\\d{4})`, "i"));
  if (m) return `${m[1]} ${m[2]}`;

  const m2 = header.match(/(\d{4})\s*(November|May|June|February|March|October)/i);
  if (m2) return `${m2[2]} ${m2[1]}`;

  return null;
}

export function parseMetadata(lines: string[], filename: string): PaperMetadata {
  const header = lines.slice(0, 25).join("\n");
  const fname = filename.replace(/\.md$/i, "");
  const parts = fname.split(/\s+/);

  const paperCodeIdx = parts.findIndex((p) => /^P\d+$/i.test(p));
  let subject = "Unknown";
  let paperCode = "P1";
  let year = 2025;

  if (paperCodeIdx > 0) {
    subject = parts.slice(0, paperCodeIdx).join(" ");
    paperCode = parts[paperCodeIdx];
    for (let i = paperCodeIdx + 1; i < parts.length; i++) {
      if (/^\d{4}$/.test(parts[i])) {
        year = parseInt(parts[i], 10);
        break;
      }
    }
  }

  const marksMatch = header.match(/MARKS:\s*(\d+)/);
  const timeMatch = header.match(/TIME:\s*([^\n<]+)/);
  const gradeMatch = header.match(/GRADE\s*(\d+)/);
  const pagesMatch = header.match(/(\d+)\s*pages/i);

  let duration = "3 hours";
  if (timeMatch) {
    duration = cleanText(timeMatch[1].trim());
    duration = duration.replace(/This question paper.*/, "").trim();
  }

  const language = /Eng/i.test(fname) ? "English" : "Afrikaans";

  return {
    subject,
    paperCode,
    examPeriod: extractExamPeriod(header) || "November 2025",
    year,
    grade: gradeMatch ? parseInt(gradeMatch[1], 10) : 12,
    qualification: "National Senior Certificate",
    language,
    totalMarks: marksMatch ? parseInt(marksMatch[1], 10) : 150,
    duration,
    pageCount: pagesMatch ? parseInt(pagesMatch[1], 10) : null,
  };
}
