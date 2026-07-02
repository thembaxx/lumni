import type { ContentBlock, DataTable, Option, Question, QuestionPart } from "@/types/exam-paper";
import {
  cleanText,
  determineAnswerFormat,
  determineType,
  extractCodeBlock,
  extractFormula,
  extractMarks,
  extractTable,
  findCodeEnd,
  removeMarks,
  tableEnd,
} from "./content-extractor";

export function extractContext(lines: string[]): ContentBlock[] {
  const context: ContentBlock[] = [];
  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();
    if (!s) continue;
    if (/^#{1,6}\s+/.test(s)) continue;

    const img = s.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (img) {
      context.push({
        type: "image",
        imagePath: img[2],
        altText: img[1] || undefined,
      });
      continue;
    }

    if (s.startsWith("|") && !/---/.test(s)) {
      const table = extractTable(lines, i);
      if (table) {
        context.push({ type: "table", tableData: table });
      }
      continue;
    }

    if (s.length > 5 && !/^[-*]\s+\d/.test(s)) {
      context.push({ type: "text", value: cleanText(s) });
    }
  }
  return context;
}

function partLevel(partId: string): number {
  if (partId.startsWith("(")) return 3;
  return partId.split(".").length - 1;
}

export function parseParts(lines: string[], _parentId: string): QuestionPart[] {
  const parts: QuestionPart[] = [];
  let i = 0;

  while (i < lines.length) {
    const stripped = lines[i].trim();
    if (!stripped) {
      i++;
      continue;
    }
    if (/^#{1,6}\s+QUESTION/i.test(stripped)) {
      i++;
      continue;
    }

    let match = stripped.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+(.*)/);
    if (!match) match = stripped.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
    if (!match) {
      const hm = stripped.match(/^#{1,6}\s+(\d+\.\d+(?:\.\d+)?)\s+(.+)/);
      if (hm) match = hm;
    }

    if (match) {
      const partId = match[1];
      let partText = match[2].trim();
      let marks: number | string | null = extractMarks(partText);
      if (marks !== null) partText = removeMarks(partText);

      const contentBlocks: ContentBlock[] = [];
      const options: Option[] = [];
      let table: DataTable | null = null;
      const sourceRefs = new Set<string>();
      let pendingOptionLetters: string[] = [];
      const subParts: QuestionPart[] = [];
      let hasSubParts = false;

      let j = i + 1;
      while (j < lines.length) {
        const ns = lines[j].trim();
        if (!ns) {
          j++;
          continue;
        }

        const nm = ns.match(/^\s*[-*]\s+(\d+\.\d+(?:\.\d+)?)\s+/);
        if (nm) {
          if (partLevel(nm[1]) <= partLevel(partId)) break;
        }
        if (/^\s*[-*]\s+\([a-z]\)/.test(ns)) {
          const subMatch = ns.match(/^\s*[-*]\s+\(([a-z])\)\s*(.*)/);
          if (subMatch) {
            hasSubParts = true;
            const subText = subMatch[2].trim();
            const subMarks: number | string | null = extractMarks(subText);
            const subCleanText = subMarks !== null ? removeMarks(subText) : subText;
            subParts.push({
              id: `(${subMatch[1]})`,
              text: subCleanText || null,
              type: determineType(subCleanText, [], null),
              marks: subMarks,
            });
            j++;
            continue;
          }
        }
        if (/^#{1,6}\s+/.test(ns)) {
          if (/^#{1,6}\s+QUESTION/i.test(ns)) break;
          if (/^#{1,6}\s+SECTION/i.test(ns)) break;
          const sm = ns.match(/^#{1,6}\s+(\d+\.\d+)/);
          if (sm && partLevel(sm[1]) <= partLevel(partId)) break;
        }

        const compoundMarks = ns.match(/^\((\d+)\s*x\s*(\d+)\)\s*\((\d+)\)\s*$/);
        if (compoundMarks) {
          if (marks === null)
            marks = `(${compoundMarks[1]} x ${compoundMarks[2]}) (${compoundMarks[3]})`;
          j++;
          continue;
        }

        const simpleMarks = ns.match(/^\((\d+)\)\s*$/);
        if (simpleMarks) {
          if (marks === null) marks = parseInt(simpleMarks[1], 10);
          j++;
          continue;
        }

        const marksOnlyPair = ns.match(/^\((\d+)\s*x\s*(\d+)\)\s*$/);
        if (marksOnlyPair) {
          if (marks === null) marks = `(${marksOnlyPair[1]} x ${marksOnlyPair[2]})`;
          j++;
          continue;
        }

        if (ns.startsWith("|") && !/---/.test(ns)) {
          if (table === null) {
            table = extractTable(lines, j);
            j = tableEnd(lines, j);
            continue;
          }
        }
        if (ns.startsWith("|") && /---/.test(ns)) {
          j++;
          continue;
        }

        if (ns.startsWith("```")) {
          const codeBlock = extractCodeBlock(lines, j);
          if (codeBlock) {
            contentBlocks.push(codeBlock);
            j = findCodeEnd(lines, j);
            continue;
          }
        }

        if (ns.startsWith("$$")) {
          const formula = extractFormula(lines, j);
          if (formula) {
            contentBlocks.push(formula);
            j += 3;
            continue;
          }
        }

        const img = ns.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
        if (img) {
          contentBlocks.push({
            type: "image",
            imagePath: img[2],
            altText: img[1] || undefined,
          });
          j++;
          continue;
        }

        const optLetter = ns.match(/^\s*[-*]\s+([A-D])\s*$/);
        if (optLetter) {
          pendingOptionLetters.push(optLetter[1]);
          j++;
          continue;
        }

        const opt2 = ns.match(/^\s*[-*]\s+\(([ivx]+)\)\s+(.+)/i);
        if (opt2) {
          options.push({
            id: opt2[1],
            text: opt2[2].trim(),
            isCorrect: false,
          });
          j++;
          continue;
        }

        const opt = ns.match(/^\s*[-*]\s+([A-Z])\s+(.+)/);
        if (opt) {
          options.push({
            id: opt[1],
            text: opt[2].trim(),
            isCorrect: false,
          });
          j++;
          continue;
        }

        if (pendingOptionLetters.length > 0) {
          const clean = cleanText(ns);
          const texts = clean.split(/\.\s+/).reduce((acc, t) => {
            const trimmed = t.trim();
            if (trimmed.length > 0) acc.push(trimmed);
            return acc;
          }, [] as string[]);
          if (texts.length >= pendingOptionLetters.length) {
            for (let k = 0; k < pendingOptionLetters.length; k++) {
              if (texts[k])
                options.push({
                  id: pendingOptionLetters[k],
                  text: texts[k],
                  isCorrect: false,
                });
            }
            pendingOptionLetters = [];
            j++;
            continue;
          }
        }

        const sources = ns.matchAll(/Source\s+(\d+[A-Z])/g);
        for (const s of sources) {
          if (!sourceRefs.has(s[1])) sourceRefs.add(s[1]);
        }

        if (ns.length > 2) {
          const clean = cleanText(ns);
          if (clean && !/Copyright/i.test(clean)) {
            const existingTexts = new Set<string>();
            for (const cb of contentBlocks) {
              if (cb.type === "text" && cb.value) existingTexts.add(cb.value);
            }
            if (!existingTexts.has(clean))
              contentBlocks.push({
                type: "text",
                value: clean,
              });
          }
        }
        j++;
      }

      const qType = determineType(partText, options, table);
      const part: QuestionPart = {
        id: partId,
        text: partText || null,
        type: qType,
        marks,
        answerFormat: determineAnswerFormat(qType, options, table),
        content: contentBlocks.length > 0 ? contentBlocks : null,
        options: options.length > 0 ? options : null,
        table: table,
        sourceRefs: sourceRefs.size > 0 ? [...sourceRefs] : null,
        subParts: hasSubParts ? subParts : null,
      };

      const cleaned = Object.fromEntries(
        Object.entries(part).filter(([, v]) => v !== null),
      ) as QuestionPart;
      parts.push(cleaned);
      i = j;
    } else {
      i++;
    }
  }
  return parts;
}

export function buildQuestion(
  qInfo: { id: string; title: string | null },
  lines: string[],
): Question {
  let totalMarks: number | null = null;
  for (const line of lines.slice(-5)) {
    const m = line.match(/\[(\d+)\]/);
    if (m) {
      totalMarks = parseInt(m[1], 10);
      break;
    }
  }

  const context = extractContext(lines);
  const parts = parseParts(lines, qInfo.id);

  if (parts.length === 0) {
    const bodyText = lines
      .reduce((acc, l) => {
        const s = l.trim();
        if (s && !s.startsWith("#") && !s.startsWith("![")) {
          const t = cleanText(l);
          if (t.length > 20 && !/Copyright|Please turn over|Confidential/i.test(t)) {
            acc.push(t);
          }
        }
        return acc;
      }, [] as string[])
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

  return {
    id: qInfo.id,
    title: qInfo.title,
    context: context.length > 0 ? context : null,
    parts,
    totalMarks,
  };
}
