import type { QuestionType } from "./enums";

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

export interface SubQuestion {
  id: string;
  questionText: string;
  type: QuestionType;
  points: number;
  body: QuestionBody[QuestionType];
}

export interface MixedPart {
  id: string;
  questionText: string;
  type: QuestionType;
  points: number;
  body: QuestionBody[QuestionType];
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
