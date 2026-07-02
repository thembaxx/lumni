import type { ContentBlock, Question, Section } from "@/types/exam-paper";
import { buildQuestion } from "./question-parser";

export function isStructural(
  line: string,
  afterInstructions: boolean,
): [string, string | null, string | null] | null {
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

  if (/^#{1,6}\s*\[\d+\]/.test(s)) return ["marks", null, null];
  if (/^#{1,6}\s*TOTAL/i.test(s)) return ["total", null, null];

  return null;
}

export function mergeDuplicateSections(sections: Section[]): Section[] {
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

export function splitMismatchedQuestions(sections: Section[]): Section[] {
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

function fallbackParseSections(lines: string[]): Section[] {
  const questions: Question[] = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^#{1,6}\s+QUESTION\s+(\d+)[\s:]*(.*)?/i);
    if (m) {
      let end = lines.length;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#{1,6}\s+QUESTION\s+/i.test(lines[j])) {
          end = j;
          break;
        }
      }
      questions.push(buildQuestion({ id: m[1], title: m[2]?.trim() || null }, lines.slice(i, end)));
    }
  }
  if (questions.length > 0) return [{ id: "A", title: null, questions }];
  return [];
}

function parseImageOnlySection(lines: string[]): Section {
  const images: ContentBlock[] = [];
  for (const line of lines) {
    const match = line.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (match)
      images.push({
        type: "image",
        imagePath: match[2],
        altText: match[1] || undefined,
      });
  }
  return {
    id: "A",
    title: null,
    questions: [
      {
        id: "1",
        title: null,
        parts: [
          {
            id: "1.1",
            type: "data-response",
            content: images,
          },
        ],
      },
    ],
  };
}

export function parseSections(lines: string[], instructionsEndLine: number): Section[] {
  const nonImageLines = lines.filter((l) => l.trim() && !l.trim().startsWith("!["));
  if (nonImageLines.length < 10) return [parseImageOnlySection(lines)];

  const contentStart = instructionsEndLine;
  const contentLines = lines.slice(contentStart);

  const markers: Array<{
    lineIdx: number;
    type: string;
    id: string | null;
    title: string | null;
  }> = [];

  for (let i = 0; i < contentLines.length; i++) {
    const result = isStructural(contentLines[i], true);
    if (result) {
      markers.push({
        lineIdx: i + contentStart,
        type: result[0],
        id: result[1],
        title: result[2],
      });
    }
  }

  if (markers.length === 0) return fallbackParseSections(lines);

  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentQuestion: { id: string; title: string | null } | null = null;
  let questionStartLine: number | null = null;

  for (let idx = 0; idx < markers.length; idx++) {
    const { lineIdx, type, id, title } = markers[idx];

    if (type === "section") {
      if (currentSection) {
        if (currentQuestion && questionStartLine !== null) {
          const sectionQuestions = currentSection.questions;
          sectionQuestions.push(
            buildQuestion(currentQuestion, lines.slice(questionStartLine, lineIdx)),
          );
          currentQuestion = null;
          questionStartLine = null;
        }
        if (currentSection.questions.length > 0) sections.push(currentSection);
      }
      currentSection = { id: id || "A", title, questions: [] };
    } else if (type === "question") {
      if (!currentSection) currentSection = { id: "A", title: null, questions: [] };
      if (currentQuestion && questionStartLine !== null) {
        currentSection.questions.push(
          buildQuestion(currentQuestion, lines.slice(questionStartLine, lineIdx)),
        );
      }
      currentQuestion = { id: id || "1", title };
      questionStartLine = lineIdx;
    } else if (type === "marks" || type === "total") {
      if (currentQuestion && questionStartLine !== null && currentSection) {
        currentSection.questions.push(
          buildQuestion(currentQuestion, lines.slice(questionStartLine, lineIdx)),
        );
        currentQuestion = null;
        questionStartLine = null;
      }
    }
  }

  if (currentSection) {
    if (currentQuestion && questionStartLine !== null) {
      currentSection.questions.push(
        buildQuestion(currentQuestion, lines.slice(questionStartLine)),
      );
    }
    if (currentSection.questions.length > 0) sections.push(currentSection);
  }

  return splitMismatchedQuestions(mergeDuplicateSections(sections));
}
