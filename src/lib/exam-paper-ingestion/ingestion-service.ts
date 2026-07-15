import { nanoid } from "nanoid";
import { dexieDataAccess } from "@/lib/db";
import type { DataAccess } from "@/lib/db/data-access";
import { extractQuestionsFromPaper } from "./question-extractor";
import { classifyQuestions } from "./question-classifier";
import { getCurriculumTopics } from "./curriculum-topics";
import type { CurriculumTopic } from "./question-classifier";
import { convertPdfWithMarker } from "@/lib/exams/marker-client";
import { getAI } from "@/lib/ai/client";
import { logError } from "@/lib/shared/logger";
import type { ExamPaper } from "@/types/exam-paper";
import type { PastPaperQuestion } from "./past-paper-question-types";

interface IngestionConfig {
  subject: string;
  year: number;
  paperNumber: number;
  totalMarks: number;
  duration: string;
  examPeriod: "may-june" | "november";
  language: string;
  grade: number;
  curriculumTopics: CurriculumTopic[];
}

interface StructuredQuestion {
  questionId: string;
  partId?: string;
  questionText: string;
  answerText?: string;
  marks?: number;
  questionType?: string;
  bloomLevel?: string;
}

interface IngestionResult {
  totalExtracted: number;
  totalPublished: number;
  questions: PastPaperQuestion[];
  stats: { withAnswer: number; withoutAnswer: number };
}

interface StructuredIngestionResult {
  publishedCount: number;
  failedCount: number;
  errors: string[];
}

export class PastPaperIngestionService {
  private db: DataAccess;

  constructor(deps?: { db?: DataAccess }) {
    this.db = deps?.db ?? dexieDataAccess;
  }

  async ingestFromPdf(
    pdfBuffer: Buffer,
    filename: string,
    config: IngestionConfig,
  ): Promise<IngestionResult> {
    // Convert PDF to markdown using marker
    const { convertPdfWithMarker } = await import("@/lib/exams/marker-client");
    const markerResult = await convertPdfWithMarker(pdfBuffer, filename);

    // Parse markdown into ExamPaper structure
    const paper = await this.parseMarkdownToExamPaper(markerResult.markdown, config);
    
    // Also try to parse memo if available
    // (This would need a separate memo PDF or marker result)

    const { questions, stats } = extractQuestionsFromPaper(
      paper,
      null, // memo - would need separate PDF
      config.subject,
      config.year,
      config.paperNumber,
    );

    // Classify questions against curriculum
    if (questions.length > 0 && config.curriculumTopics.length > 0) {
      const ai = getAI();
      const curriculumTopics = config.curriculumTopics.map((t) => ({
        id: t.id,
        subject: t.subject,
        topic: t.topic,
        subtopic: t.subtopic,
      }));
      const classifications = await classifyQuestions(
        questions.map((q) => ({
          id: q.id,
          questionText: q.questionText,
          subject: config.subject,
        })),
        curriculumTopics,
        ai,
      );

      for (const q of questions) {
        const subtopicId = classifications.get(q.id);
        if (subtopicId) {
          q.subtopicId = subtopicId;
        }
      }
    }

    // Persist to Dexie
    await this.persistQuestions(questions);

    return {
      totalExtracted: questions.length,
      totalPublished: questions.length,
      questions,
      stats,
    };
  }

  async ingestStructured(
    questions: StructuredQuestion[],
    config: IngestionConfig,
  ): Promise<StructuredIngestionResult> {
    const published: PastPaperQuestion[] = [];
    const errors: string[] = [];

    for (const q of questions) {
      try {
        const pastPaperQuestion: PastPaperQuestion = {
          id: nanoid(),
          subject: config.subject,
          year: config.year,
          paperNumber: config.paperNumber,
          sectionTitle: "Structured Import",
          topic: "Structured Import",
          questionId: q.questionId,
          partId: q.partId || `p${Date.now()}`,
          questionText: q.questionText,
          answerText: q.answerText || "",
          marks: q.marks || 0,
          questionType: q.questionType
            ? this.determineQuestionType(q.questionType)
            : "short-answer",
          bloomLevel: q.bloomLevel || this.inferBloomLevel(q.questionType || "short-answer", q.marks || 0, q.questionText),
          createdAt: new Date().toISOString(),
        };

        published.push(pastPaperQuestion);
      } catch (err) {
        errors.push(`Question ${q.questionId}: ${err instanceof Error ? err.message : "unknown"}`);
      }
    }

    // Persist
    await this.persistQuestions(published);

    return {
      publishedCount: published.length,
      failedCount: errors.length,
      errors,
    };
  }

  private async parseMarkdownToExamPaper(
    markdown: string,
    config: IngestionConfig,
  ): Promise<ExamPaper> {
    // This is a simplified parser - in production you'd use a proper markdown parser
    // For now, create a basic structure
    const sections = markdown.split(/^##\s+/m).filter(Boolean);
    
    const parsedSections = sections.map((section, si) => {
      const lines = section.split("\n").filter(Boolean);
      const title = lines[0] || `Section ${si + 1}`;
      const content = lines.slice(1).join("\n");
      
      // Parse questions from content (simplified)
      const questions = this.parseQuestionsFromContent(content, si);
      
      return { 
        id: `section_${si}`,
        title, 
        questions 
      };
    });

    return {
      id: `paper_${config.subject}_${config.year}_p${config.paperNumber}`,
      year: config.year,
      session: config.examPeriod === "may-june" ? "may-june" : "october-november",
      grade: config.grade,
      subjects: [config.subject],
      sections: parsedSections,
    };
  }

  private parseQuestionsFromContent(content: string, sectionIndex: number): ExamPaper["sections"][number]["questions"] {
    // Simplified question parser - split by question markers
    const questionBlocks = content.split(/(?:^|\n)(?:Question|Q)\s*\d+/i).filter(Boolean);
    
    return questionBlocks.map((block, qi) => ({
      id: `q${qi}`,
      parts: [{
        id: `p0`,
        text: block.trim().slice(0, 500),
        type: "text" as const,
        marks: 0,
      }],
    }));
  }

  private async persistQuestions(questions: PastPaperQuestion[]): Promise<void> {
    await this.db.pastPaperQuestions.bulkAdd(questions);
  }

  private determineQuestionType(type: string): import("@/lib/question-engine/types").QuestionType {
    switch (type.toLowerCase()) {
      case "multiple-choice":
      case "mcq":
        return "multiple-choice";
      case "matching":
        return "matching";
      case "essay":
        return "essay";
      case "calculation":
      case "calculate":
        return "calculation";
      case "diagram":
      case "draw":
        return "diagram";
      case "programming":
      case "code":
        return "programming";
      case "source-based":
        return "source-based";
      case "data-response":
        return "data-response";
      default:
        return "short-answer";
    }
  }

  private inferBloomLevel(questionType: string, marks: number, questionText: string): string {
    const text = questionText.toLowerCase();

    if (/\b(define|name|state|list|recall|identify|label)\b/.test(text)) return "remember";
    if (/\b(explain|describe|summarise|summarize|compare|contrast|interpret|paraphrase)\b/.test(text))
      return "understand";
    if (
      /\b(apply|calculate|solve|compute|demonstrate|use|perform|implement|classify|categorise|categorize)\b/.test(
        text,
      )
    )
      return "apply";
    if (
      /\b(analy[sz]e|examine|differentiate|organise|organize|distinguish|break down|investigate|compare and)\b/.test(
        text,
      )
    )
      return "analyze";
    if (
      /\b(evaluate|justify|assess|critique|judge|argue|defend|recommend|prioritise|prioritize)\b/.test(
        text,
      )
    )
      return "evaluate";
    if (/\b(create|design|construct|develop|formulate|compose|propose|generate)\b/.test(text))
      return "create";

    if (marks <= 2) return "remember";
    if (marks <= 4) return "understand";
    if (marks <= 6) return "apply";
    if (marks <= 8) return "analyze";
    return "evaluate";
  }
}

export const pastPaperIngestionService = new PastPaperIngestionService();