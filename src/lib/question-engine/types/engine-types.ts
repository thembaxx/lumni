import type { Effect } from "effect";
import type { Difficulty, BloomLevel, QuestionType } from "./enums";
import type { QuestionBody, MediaContent } from "./body-types";

export interface QuestionSource {
  url: string;
  title: string;
}

export interface QuestionMetadata {
  createdAt?: number;
  updatedAt?: number;
  version?: number;
  source?: "generated" | "imported" | "edited";
}

export interface Question<T extends QuestionType = QuestionType> {
  id: string;
  type: T;
  subject: string;
  topic: string;
  difficulty: Difficulty;
  bloomTaxonomy: BloomLevel;
  points: number;
  questionText: string;
  hint: string;
  explanation: string;
  steps?: string[];
  media?: MediaContent[];
  body: QuestionBody[T];
  metadata?: QuestionMetadata;
  webSources?: QuestionSource[];
  pruned?: boolean;
  sourcePaperId?: string;
  sourcePastPaperQuestionId?: string;
  pastPaperMetadata?: {
    year: number;
    paperNumber: number;
    sectionName?: string;
    questionNumber?: string;
    markScheme?: string;
    totalMarks?: number;
  };
}

export interface UserAnswer {
  type:
    | "option-ids"
    | "pairs"
    | "text"
    | "code"
    | "numeric"
    | "coordinates"
    | "mixed"
    | "ordered-items"
    | "sequence-blanks"
    | "label-placements"
    | "region-click";
  value: unknown;
}

export interface GradingResult {
  correct: boolean;
  score: number;
  maxScore: number;
  feedback: string;
  breakdown?: {
    criterion: string;
    score: number;
    maxScore: number;
    feedback: string;
  }[];
}

export interface GenerationParams {
  subject: string;
  topic?: string;
  curriculumUnit?: string;
  curriculumContext?: string;
  difficulty?: Difficulty;
  bloomLevel?: BloomLevel;
  topicCompetencyLevel?: "novice" | "developing" | "proficient" | "mastered";
  topicCompetencyScore?: number;
  suggestedBloomLevel?: BloomLevel;
  suggestedDifficulty?: Difficulty;
  questionType?: QuestionType | QuestionType[] | "any";
  count: number;
  sourceExamPaper?: string;
  pastPaperMode?: boolean;
  pastPaperExamples?: {
    questionText: string;
    answerText: string;
    marks: number;
    year: number;
  }[];
  remediationFocus?: string;
  userId?: string | null;
  poolQuestions?: {
    id: string;
    questionText: string;
    answerText: string;
    marks: number;
    year: number;
    paperNumber: number;
    topic?: string;
    similarity: number;
    type?: string;
    bloomLevel?: string;
    subtopicId?: string;
  }[];
}

export interface HintParams {
  questionId: string;
  question: Question;
  studentAnswer?: UserAnswer;
  ragXml?: string;
}

export interface GenerateResult {
  questions: Question[];
  ragContext: import("../prompt-manager").RagContext | null;
}

export interface QuestionProcessor<T extends QuestionType = QuestionType> {
  type: T;
  generate(
    params: GenerationParams,
    ragContext?: { sources: unknown[]; xml: string; domainsQueried: string[] },
  ): Promise<Question<T>[]>;
  generateHint(question: Question<T>, ragXml?: string): Promise<string>;
  grade(question: Question<T>, answer: UserAnswer): Promise<GradingResult>;
  validate(question: Question<T>): ValidationResult;
  generateFromSource?(source: string, params: GenerationParams): Promise<Question<T>[]>;
  generateEffect(
    params: GenerationParams,
    ragContext?: { sources: unknown[]; xml: string; domainsQueried: string[] },
  ): Effect.Effect<Question<T>[]>;
  gradeEffect(question: Question<T>, answer: UserAnswer): Effect.Effect<GradingResult>;
  generateHintEffect(question: Question<T>, ragXml?: string): Effect.Effect<string>;
}

export interface ValidationError {
  type: "schema" | "quality" | "consistency" | "content";
  field: string;
  message: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number;
}
