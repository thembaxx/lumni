import * as fs from "node:fs";
import * as path from "node:path";
import type { ExamPaper } from "@/types/exam-paper";
import { MarkdownExamParser } from "./markdown-exam-parser";

export { MarkdownExamParser } from "./markdown-exam-parser";

export function parseMarkdown(content: string, filename: string): ExamPaper {
  const parser = new MarkdownExamParser(content, filename);
  return parser.parse();
}

export function convertMarkdownToJson(inputDir: string, outputDir: string): void {
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const files = fs
    .readdirSync(inputDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".markdown"));
  console.log(`Found ${files.length} markdown file(s) in "${inputDir}"`);

  for (const filename of files) {
    const inputPath = path.join(inputDir, filename);
    const content = fs.readFileSync(inputPath, "utf-8");
    console.log(`\nProcessing: ${filename}`);

    const result = parseMarkdown(content, filename);

    const baseName = filename.replace(/\.md$/i, "").replace(/\s+/g, "_");
    const outputPath = path.join(outputDir, `${baseName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), "utf-8");

    console.log(`  Written: ${outputPath}`);
    console.log(`  Subject: ${result.metadata.subject}`);
    console.log(`  Sections: ${result.sections.length}`);
    const totalQuestions = result.sections.reduce((sum, s) => sum + s.questions.length, 0);
    console.log(`  Questions: ${totalQuestions}`);
    const totalParts = result.sections.reduce(
      (sum, s) => sum + s.questions.reduce((qsum, q) => qsum + q.parts.length, 0),
      0,
    );
    console.log(`  Parts: ${totalParts}`);
  }

  console.log(`\nConversion complete! Output written to "${outputDir}"`);
}
