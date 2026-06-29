import type { Effect } from "effect";

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
  | "mixed"
  | "ordering"
  | "fill-in-sequence"
  | "match-pairs"
  | "diagram-labelling"
  | "hot-spot";

export type Difficulty = "Easy" | "Medium" | "Hard";

export type BloomLevel = "remember" | "understand" | "apply" | "analyze" | "evaluate" | "create";

export interface Option {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface OrderingItem {
  id: string;
  text: string;
}

export interface SequenceBlank {
  id: string;
  correctAnswer: string;
  distractors?: string[];
}

export interface SequenceSlot {
  text: string;
  blankId?: string;
}

export interface RubricCriterion {
  name: string;
  description: string;
  maxScore: number;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface SubQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  points: number;
  body: QuestionBody[QuestionType];
}

export interface Source {
  type: "text" | "image" | "table" | "graph" | "map" | "infographic";
  content: string;
  attribution?: string;
  mediaUrl?: string;
}

export interface DataSet {
  type: "table" | "chart" | "graph";
  title: string;
  headers?: string[];
  rows?: Record<string, string | number>[];
  chartType?: "bar" | "line" | "pie" | "scatter";
  chartData?: Record<string, unknown>;
}

export interface MixedPart {
  id: string;
  questionText: string;
  type: QuestionType;
  points: number;
  body: QuestionBody[QuestionType];
}

export interface DiagramSpec {
  type:
    | "force-vector"
    | "circuit"
    | "wave"
    | "motion"
    | "node-flow"
    | "node"
    | "custom-svg"
    | "geometry"
    | "chart"
    | "chemistry"
    | "graph";
  title: string;
  data: Record<string, unknown>;
}

export interface MediaContent {
  type: "inline-svg" | "image-url" | "diagram-data" | "map-coordinates" | "interactive";
  label: string;
  svgContent?: string;
  diagramData?: DiagramSpec;
  imageUrl?: string;
  attribution?: string;
  mapCoordinates?: {
    lat: number;
    lng: number;
    zoom: number;
    markerLabel?: string;
  };
  interactiveUrl?: string;
  interactiveData?: Record<string, unknown>;
}

export interface QuestionBody {
  "multiple-choice": {
    options: Option[];
    correctOptionId: string;
    allowMultiple: boolean;
  };
  matching: {
    pairs: { left: string; right: string }[];
    shuffle: boolean;
  };
  "short-answer": {
    modelAnswer: string;
    acceptableAnswers: string[];
    maxLength: number;
  };
  "long-answer": {
    rubric: RubricCriterion[];
    modelAnswer: string;
    minWords: number;
    maxWords: number;
  };
  essay: {
    rubric: RubricCriterion[];
    modelAnswer: string;
    wordLimit: number;
  };
  calculation: {
    formula: string;
    correctValue: number;
    unit: string;
    tolerance: number;
  };
  diagram: {
    diagramData: DiagramSpec;
    instructions: string;
  };
  "source-based": {
    source: Source;
    subQuestions: SubQuestion[];
  };
  programming: {
    language: string;
    starterCode?: string;
    testCases: TestCase[];
    timeLimit: number;
  };
  "data-response": {
    data: DataSet;
    questions: SubQuestion[];
  };
  mixed: {
    parts: MixedPart[];
  };
  ordering: {
    items: OrderingItem[];
    correctOrder: string[];
    shuffle: boolean;
  };
  "fill-in-sequence": {
    sequence: SequenceSlot[];
    blanks: SequenceBlank[];
    shuffleDistractors: boolean;
  };
  "match-pairs": {
    leftItems: { id: string; text: string }[];
    rightItems: { id: string; text: string }[];
    correctMatches: { leftId: string; rightId: string }[];
    shuffle: boolean;
  };
  "diagram-labelling": {
    imageUrl?: string;
    svgContent?: string;
    width: number;
    height: number;
    regions: {
      id: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    labels: { id: string; text: string }[];
    correctPlacements: { labelId: string; regionId: string }[];
  };
  "hot-spot": {
    imageUrl?: string;
    width: number;
    height: number;
    regions: {
      id: string;
      label: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }[];
    correctRegionId: string;
  };
}

export interface QuestionMetadata {
  createdAt?: number;
  updatedAt?: number;
  version?: number;
  source?: "generated" | "imported" | "edited";
}

export interface QuestionSource {
  url: string;
  title: string;
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
  ragContext: import("./prompt-manager").RagContext | null;
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
