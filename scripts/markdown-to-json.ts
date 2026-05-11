import * as fs from "fs";
import * as path from "path";

// ═══════════════════════════════════════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExamPaper {
  metadata: PaperMetadata;
  instructions: string[];
  sections: Section[];
}

export interface PaperMetadata {
  subject: string;
  paperCode: string;
  examPeriod: string;
  year: number;
  grade: number;
  qualification: string;
  language: string;
  totalMarks: number;
  duration: string;
  pageCount?: number | null;
}

export interface Section {
  id: string;
  title?: string | null;
  instructions?: string[];
  questions: Question[];
}

export interface Question {
  id: string;
  title?: string | null;
  context?: ContentBlock[] | null;
  parts: QuestionPart[];
  totalMarks?: number | null;
}

export interface QuestionPart {
  id: string;
  text?: string | null;
  content?: ContentBlock[] | null;
  marks?: number | string | null;
  answerFormat?: string | null;
  type: QuestionType;
  options?: Option[] | null;
  table?: DataTable | null;
  sourceRefs?: string[] | null;
  subParts?: QuestionPart[] | null;
}

export type QuestionType =
  | "multiple-choice"
  | "matching"
  | "short-answer"
  | "long-answer"
  | "essay"
  | "calculation"
  | "diagram"
  | "source-based"
  | "programming"
  | "data-response"
  | "mixed";

export interface ContentBlock {
  type: "text" | "image" | "table" | "formula" | "code";
  value?: string;
  imagePath?: string;
  altText?: string;
  tableData?: DataTable;
  language?: string;
}

export interface DataTable {
  headers: string[];
  rows: (string | number | null)[][];
}

export interface Option {
  id: string;
  text: string;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MARKDOWN EXAM PARSER
// ═══════════════════════════════════════════════════════════════════════════════

class MarkdownExamParser {
  private lines: string[];
  private filename: string;
  private instructionsEndLine: number = 0;

  constructor(content: string, filename: string) {
    this.lines = content.split(/\r?\n/);
    this.filename = filename;
  }

  parse(): ExamPaper {
    return {
      metadata: this.parseMetadata(),
      instructions: this.parseInstructions(),
      sections: this.parseSections(),
    };
  }

  private parseMetadata(): PaperMetadata {
    const header = this.lines.slice(0, 25).join("\n");
    const fname = this.filename.replace(/\.md$/i, "");
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
      duration = this.cleanText(timeMatch[1].trim());
      duration = duration.replace(/This question paper.*/, "").trim();
    }

    const language = /Eng/i.test(fname) ? "English" : "Afrikaans";

    return {
      subject,
      paperCode,
      examPeriod: "November 2025",
      year,
      grade: gradeMatch ? parseInt(gradeMatch[1], 10) : 12,
      qualification: "National Senior Certificate",
      language,
      totalMarks: marksMatch ? parseInt(marksMatch[1], 10) : 150,
      duration,
      pageCount: pagesMatch ? parseInt(pagesMatch[1], 10) : null,
    };
  }

  private parseInstructions(): string[] {
    const instructions: string[] = [];
    let inBlock = false;
    let endIdx = 0;

    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      if (/^#{1,6}\s+INSTRUCTIONS/i.test(line)) {
        inBlock = true; endIdx = i; continue;
      }
      if (inBlock) {
        if (
          /^#{1,6}\s+/.test(line) &&
          !/INSTRUCTION/i.test(line.toUpperCase()) &&
          !/SPECIFIC/i.test(line.toUpperCase())
        ) {
          endIdx = i; break;
        }
        const stripped = line.trim();
        if (!stripped) continue;
        let text = stripped.replace(/^[-*•]\s*/, "");
        text = this.cleanText(text);
        if (
          text.length > 10 &&
          !/Copyright|Please turn over|Confidential/i.test(text)
        ) {
          if (!instructions.includes(text)) instructions.push(text);
        }
      }
    }
    this.instructionsEndLine = endIdx;
    return instructions.slice(0, 20);
  }

  private parseSections(): Section[] {
    const nonImageLines = this.lines.filter(
      (l) => l.trim() && !l.trim().startsWith("![")
    );
    if (nonImageLines.length < 10) return [this.parseImageOnlySection()];

    const contentStart = this.instructionsEndLine;
    const contentLines = this.lines.slice(contentStart);

    const markers: Array<{
      lineIdx: number; type: string; id: string | null; title: string | null;
    }> = [];

    for (let i = 0; i < contentLines.length; i++) {
      const result = this.isStructural(contentLines[i], true);
      if (result) {
        markers.push({
          lineIdx: i + contentStart,
          type: result[0],
          id: result[1],
          title: result[2],
        });
      }
    }

    if (markers.length === 0) return this.fallbackParseSections();

    const sections: Section[] = [];
    let currentSection: Section | null = null;
    let currentQuestion: { id: string; title: string | null } | null = null;
    let questionStartLine: number | null = null;

    for (let idx = 0; idx < markers.length; idx++) {
      const { lineIdx, type, id, title } = markers[idx];

      if (type === "section") {
        if (currentSection) {
          if (currentQuestion && questionStartLine !== null) {
            currentSection.questions.push(
              this.buildQuestion(currentQuestion, this.lines.slice(questionStartLine, lineIdx))
            );
            currentQuestion = null; questionStartLine = null;
          }
          if (currentSection.questions.length > 0) sections.push(currentSection);
        }
        currentSection = { id: id || "A", title, questions: [] };
      } else if (type === "question") {
        if (!currentSection) currentSection = { id: "A", title: null, questions: [] };
        if (currentQuestion && questionStartLine !== null) {
          currentSection.questions.push(
            this.buildQuestion(currentQuestion, this.lines.slice(questionStartLine, lineIdx))
          );
        }
        currentQuestion = { id: id || "1", title };
        questionStartLine = lineIdx;
      } else if (type === "marks" || type === "total") {
        if (currentQuestion && questionStartLine !== null && currentSection) {
          currentSection.questions.push(
            this.buildQuestion(currentQuestion, this.lines.slice(questionStartLine, lineIdx))
          );
          currentQuestion = null; questionStartLine = null;
        }
      }
    }

    if (currentSection) {
      if (currentQuestion && questionStartLine !== null) {
        currentSection.questions.push(
          this.buildQuestion(currentQuestion, this.lines.slice(questionStartLine))
        );
      }
      if (currentSection.questions.length > 0) sections.push(currentSection);
    }

    return this.splitMismatchedQuestions(this.mergeDuplicateSections(sections));
  }

  private mergeDuplicateSections(sections: Section[]): Section[] {
    const merged = new Map<string, Section>();
    for (const sec of sections) {
      const existing = merged.get(sec.id);
      if (existing) {
        const questionMap = new Map<string, Question>();
        for (const q of existing.questions) questionMap.set(q.id, q);
        for (const q of sec.questions) {
          const existingQ = questionMap.get(q.id);
          if (!existingQ || (q.parts?.length || 0) > (existingQ.parts?.length || 0)) {
            questionMap.set(q.id, q);
          }
        }
        existing.questions = Array.from(questionMap.values());
        if (!existing.title && sec.title) existing.title = sec.title;
      } else {
        merged.set(sec.id, { ...sec });
      }
    }
    return Array.from(merged.values());
  }

  private splitMismatchedQuestions(sections: Section[]): Section[] {
    for (const sec of sections) {
      const newQuestions: Question[] = [];
      for (const q of sec.questions) {
        let expectedMajor = parseInt(q.id, 10);
        const splitPoints: number[] = [];
        for (let i = 0; i < q.parts.length; i++) {
          const majorMatch = q.parts[i].id.match(/^(\d+)/);
          if (majorMatch) {
            const major = parseInt(majorMatch[1], 10);
            if (major !== expectedMajor && major > expectedMajor) {
              splitPoints.push(i);
              expectedMajor = major;
            }
          }
        }
        if (splitPoints.length === 0) {
          newQuestions.push(q);
          continue;
        }
        let start = 0;
        for (const splitIdx of splitPoints) {
          const subParts = q.parts.slice(start, splitIdx);
          if (subParts.length > 0) {
            const majorMatch = subParts[0].id.match(/^(\d+)/);
            newQuestions.push({
              id: majorMatch ? majorMatch[1] : q.id,
              title: q.title,
              parts: subParts,
              totalMarks: null,
            });
          }
          start = splitIdx;
        }
        const remaining = q.parts.slice(start);
        if (remaining.length > 0) {
          const majorMatch = remaining[0].id.match(/^(\d+)/);
          newQuestions.push({
            id: majorMatch ? majorMatch[1] : q.id,
            title: q.title,
            parts: remaining,
            totalMarks: null,
          });
        }
      }
      sec.questions = newQuestions;
    }
    return sections;
  }

  private fallbackParseSections(): Section[] {
    const questions: Question[] = [];
    for (let i = 0; i < this.lines.length; i++) {
      const m = this.lines[i].match(/^#{1,6}\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
      if (m) {
        let end = this.lines.length;
        for (let j = i + 1; j < this.lines.length; j++) {
          if (/^#{1,6}\s+QUESTION\s+/i.test(this.lines[j])) { end = j; break; }
        }
        questions.push(this.buildQuestion(
          { id: m[1], title: m[2]?.trim() || null },
          this.lines.slice(i, end)
        ));
      }
    }
    if (questions.length > 0) return [{ id: "A", title: null, questions }];
    return [];
  }

  private buildQuestion(
    qInfo: { id: string; title: string | null },
    lines: string[]
  ): Question {
    let totalMarks: number | null = null;
    for (const line of lines.slice(-5)) {
      const m = line.match(/\[(\d+)\]/);
      if (m) { totalMarks = parseInt(m[1], 10); break; }
    }
    const parts = this.parseParts(lines, qInfo.id);

    if (parts.length === 0) {
      const bodyText = lines
        .filter((l) => { const s = l.trim(); return s && !s.startsWith("#") && !s.startsWith("!["); })
        .map((l) => this.cleanText(l))
        .filter((t) => t.length > 20 && !/Copyright|Please turn over|Confidential/i.test(t))
        .join(" ");
      if (bodyText) {
        parts.push({
          id: `${qInfo.id}.1`,
          text: bodyText.substring(0, 300) + (bodyText.length > 300 ? "..." : ""),
          type: "essay",
          marks: totalMarks,
        });
      }
    }

    return { id: qInfo.id, title: qInfo.title, parts, totalMarks };
  }

  private parseParts(lines: string[], parentId: string): QuestionPart[] {
    const parts: QuestionPart[] = [];
    let i = 0;

    while (i < lines.length) {
      const stripped = lines[i].trim();
      if (!stripped) { i++; continue; }
      if (/^#{1,6}\s+QUESTION/i.test(stripped)) { i++; continue; }

      let match = stripped.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+(.*)/);
      if (!match) match = stripped.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
      if (!match) {
        const hm = stripped.match(/^#{1,6}\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
        if (hm) match = hm;
      }

      if (match) {
        const partId = match[1];
        let partText = match[2].trim();
        let marks: number | string | null = this.extractMarks(partText);
        if (marks !== null) partText = this.removeMarks(partText);

        const contentBlocks: ContentBlock[] = [];
        const options: Option[] = [];
        let table: DataTable | null = null;
        const sourceRefs: string[] = [];
        let pendingOptionLetters: string[] = [];

        let j = i + 1;
        while (j < lines.length) {
          const ns = lines[j].trim();
          if (!ns) { j++; continue; }

          const nm = ns.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+/);
          if (nm) {
            if (this.partLevel(nm[1]) <= this.partLevel(partId)) break;
          }
          if (/^\s*[-*]\s+\([a-z]\)/.test(ns)) break;
          if (/^#{1,6}\s+/.test(ns)) {
            if (/^#{1,6}\s+QUESTION/i.test(ns)) break;
            if (/^#{1,6}\s+SECTION/i.test(ns)) break;
            const sm = ns.match(/^#{1,6}\s+(\d+\.\d+)/);
            if (sm && this.partLevel(sm[1]) <= this.partLevel(partId)) break;
          }

          const smarks = ns.match(/^\((\d+)\)\s*$/);
          if (smarks) {
            if (marks === null) marks = parseInt(smarks[1], 10);
            j++; continue;
          }

          if (ns.startsWith("|") && !/---/.test(ns)) {
            if (table === null) {
              table = this.extractTable(lines, j);
              j = this.tableEnd(lines, j);
              continue;
            }
          }
          if (ns.startsWith("|") && /---/.test(ns)) { j++; continue; }

          const img = ns.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
          if (img) {
            contentBlocks.push({ type: "image", imagePath: img[2], altText: img[1] || undefined });
            j++; continue;
          }

          const optLetter = ns.match(/^\s*[-*]\s+([A-D])\s*$/);
          if (optLetter) { pendingOptionLetters.push(optLetter[1]); j++; continue; }

          const opt = ns.match(/^\s*[-*]\s+([A-Z])\s+(.+)/);
          if (opt) { options.push({ id: opt[1], text: opt[2].trim() }); j++; continue; }

          const opt2 = ns.match(/^\s*[-*]\s+\(([ivx]+)\)\s+(.+)/i);
          if (opt2) { options.push({ id: opt2[1], text: opt2[2].trim() }); j++; continue; }

          if (pendingOptionLetters.length > 0) {
            const clean = this.cleanText(ns);
            const texts = clean.split(/\.\s+/).map((t) => t.trim()).filter((t) => t.length > 0);
            if (texts.length >= pendingOptionLetters.length) {
              for (let k = 0; k < pendingOptionLetters.length; k++) {
                if (texts[k]) options.push({ id: pendingOptionLetters[k], text: texts[k] });
              }
              pendingOptionLetters = []; j++; continue;
            }
          }

          const sources = ns.matchAll(/Source\s+(\d+[A-Z])/g);
          for (const s of sources) { if (!sourceRefs.includes(s[1])) sourceRefs.push(s[1]); }

          if (ns.length > 2) {
            const clean = this.cleanText(ns);
            if (clean && !/Copyright/i.test(clean)) {
              const existing = contentBlocks.filter((c) => c.type === "text").map((c) => c.value);
              if (!existing.includes(clean)) contentBlocks.push({ type: "text", value: clean });
            }
          }
          j++;
        }

        const qType = this.determineType(partText, options, table);
        const part: QuestionPart = {
          id: partId, text: partText || null, type: qType, marks,
          content: contentBlocks.length > 0 ? contentBlocks : null,
          options: options.length > 0 ? options : null,
          table: table,
          sourceRefs: sourceRefs.length > 0 ? sourceRefs : null,
        };
        parts.push(Object.fromEntries(Object.entries(part).filter(([, v]) => v !== null)) as QuestionPart);
        i = j;
      } else {
        i++;
      }
    }
    return parts;
  }

  private isStructural(line: string, afterInstructions: boolean):
    [string, string | null, string | null] | null {
    const s = line.trim();

    let m = s.match(/^#{1,6}\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
    if (m) return ["question", m[1], m[2]?.trim() || null];
    m = s.match(/^\s*[-*]\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
    if (m) return ["question", m[1], m[2]?.trim() || null];

    if (afterInstructions) {
      m = s.match(/^#{1,6}\s+SECTION\s+([A-Z])[\s:]*(.*)?/i);
      if (m) return ["section", m[1].toUpperCase(), m[2]?.trim() || null];
    }

    m = s.match(/^#{1,6}\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
    if (m) return ["subheader", m[1], m[2].trim()];

    m = s.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
    if (m) return ["subquestion", m[1], m[2].trim()];
    m = s.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
    if (m) return ["subquestion", `(${m[1]})`, m[2].trim()];

    if (/^#{1,6}\s*\[\d+\]/.test(s)) return ["marks", null, null];
    if (/^#{1,6}\s*TOTAL/i.test(s)) return ["total", null, null];

    return null;
  }

  private partLevel(partId: string): number {
    if (partId.startsWith("(")) return 3;
    return partId.split(".").length - 1;
  }

  private extractMarks(text: string): number | string | null {
    let m = text.match(/\((\d+)\s*x\s*(\d+)\)\s*\((\d+)\)$/);
    if (m) return `(${m[1]} x ${m[2]}) (${m[3]})`;
    m = text.match(/\((\d+)\s*x\s*(\d+)\)/);
    if (m) return `(${m[1]} x ${m[2]})`;
    m = text.match(/\((\d+)\)$/);
    if (m) return parseInt(m[1], 10);
    return null;
  }

  private removeMarks(text: string): string {
    text = text.replace(/\(\d+\s*x\s*\d+\)\s*\(\d+\)$/, "");
    text = text.replace(/\(\d+\s*x\s*\d+\)$/, "");
    text = text.replace(/\(\d+\)$/, "");
    return text.trim();
  }

  private extractTable(lines: string[], start: number): DataTable | null {
    const headers: string[] = [];
    const rows: (string | number | null)[][] = [];
    let foundHeader = false;
    for (let i = start; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith("|")) break;
      if (/^\|[-\s|:]+\|$/.test(line)) { foundHeader = true; continue; }
      const cells = line.split("|").slice(1, -1).map((c) => {
        let cell = c.trim().replace(/<br\s*\/?>/g, "\n").replace(/\s+/g, " ");
        return cell;
      });
      if (!foundHeader && headers.length === 0) headers.push(...cells);
      else if (foundHeader || headers.length > 0) rows.push(cells);
    }
    if (headers.length > 0) return { headers, rows };
    return null;
  }

  private tableEnd(lines: string[], start: number): number {
    for (let i = start; i < lines.length; i++) {
      if (!lines[i].trim().startsWith("|")) return i;
    }
    return lines.length;
  }

  private determineType(text: string, options: Option[], table: DataTable | null): QuestionType {
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

  private parseImageOnlySection(): Section {
    const images: ContentBlock[] = [];
    for (const line of this.lines) {
      const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
      if (match) images.push({ type: "image", imagePath: match[2], altText: match[1] || undefined });
    }
    return { id: "A", title: null, questions: [{ id: "1", title: null, parts: [{ id: "1.1", type: "data-response", content: images }] }] };
  }

  private cleanText(text: string): string {
    return text.replace(/<br\s*\/?>/g, " ").replace(/\|+/g, " ").replace(/\s+/g, " ").trim();
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN CONVERTER
// ═══════════════════════════════════════════════════════════════════════════════

function convertMarkdownToJson(inputDir: string, outputDir: string): void {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs.readdirSync(inputDir).filter((f) => f.endsWith(".md") || f.endsWith(".markdown"));
  console.log(`Found ${files.length} markdown file(s) in "${inputDir}"`);

  for (const filename of files) {
    const inputPath = path.join(inputDir, filename);
    const content = fs.readFileSync(inputPath, "utf-8");
    console.log(`\n📄 Processing: ${filename}`);

    const parser = new MarkdownExamParser(content, filename);
    const result = parser.parse();

    const baseName = filename.replace(/\.md$/i, "").replace(/\s+/g, "_");
    const outputPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

    console.log(`   ✅ Written: ${outputPath}`);
    console.log(`   📊 Subject: ${result.metadata.subject}`);
    console.log(`   📝 Sections: ${result.sections.length}`);
    const totalQuestions = result.sections.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`   ❓ Questions: ${totalQuestions}`);
    const totalParts = result.sections.reduce((sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.parts.length, 0), 0);
    console.log(`   📋 Parts: ${totalParts}`);
  }

  console.log(`\n✅ Conversion complete! Output written to "${outputDir}"`);
}

const INPUT_DIR = process.argv[2] || "./markdown";
const OUTPUT_DIR = process.argv[3] || "./JSON";
convertMarkdownToJson(INPUT_DIR, OUTPUT_DIR);