export interface ExamSessionData {
  id: string;
  examPaperId: string;
  userId: string;
  startedAt: string;
  lastSavedAt: string;
  timeRemaining: number;
  completed: boolean;
  answers: Record<string, ExamAnswer>;
  flags: string[];
}

export interface ExamAnswer {
  value: string | string[];
  answeredAt: string;
}

export interface ExamPaperFileKeys {
  pdf: string;
  markdown: string;
  json: string;
}

export interface ExamPaperMetadata {
  $id: string;
  subject: string;
  paperCode: string;
  examPeriod: string;
  year: number;
  grade: number;
  language: string;
  totalMarks: number;
  duration: string;
  fileKeys: ExamPaperFileKeys;
  uploadedAt: string;
  uploadedBy: string;
}
