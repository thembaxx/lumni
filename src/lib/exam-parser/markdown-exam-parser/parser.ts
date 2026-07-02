import type { ExamPaper, Section } from "@/types/exam-paper";
import { parseInstructions } from "./instruction-parser";
import { parseMetadata } from "./metadata-parser";
import { parseSections } from "./section-parser";

export class MarkdownExamParser {
  private lines: string[];
  private filename: string;
  private instructionsEndLine = 0;

  constructor(content: string, filename: string) {
    this.lines = content.split(/\r?\n/);
    this.filename = filename;
  }

  parse(): ExamPaper {
    const metadata = parseMetadata(this.lines, this.filename);
    const { instructions, instructionsEndLine } = parseInstructions(this.lines);
    this.instructionsEndLine = instructionsEndLine;
    const sections: Section[] = parseSections(this.lines, this.instructionsEndLine);

    return {
      metadata,
      instructions,
      sections,
    };
  }
}
