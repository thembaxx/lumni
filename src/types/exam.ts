export type ExamSession = "november" | "may-june";

export type ExamPaperType = "paper" | "memo" | "answer-book";

export type ExamLanguage = "english" | "afrikaans";

export interface PaperListing {
  id: string;
  subject: string;
  subjectId: string;
  year: number;
  session: ExamSession;
  type: ExamPaperType;
  paperNumber?: number;
  language?: ExamLanguage;
  province?: string;
  title: string;
  url: string;
  localPath?: string;
  downloadedAt?: string;
  src?: string;
  fileUrl?: string;
  fileKey?: string;
}

export interface ExamFilter {
  search: string;
  year: number | null;
  subject: string | null;
  session: string;
  language?: string;
}

export interface ExamGroup {
  subject: string;
  papers: PaperListing[];
}

/** Appwrite `exam_papers` collection record — single source of truth. */
export interface AppwriteExamPaperRecord {
  $id: string;
  subject: string;
  subjectCode: string;
  subjectName: string;
  paperCode: string;
  paperNumber: number;
  examPeriod: string;
  year: number;
  grade: number;
  language: string;
  totalMarks: number;
  duration: string;
  type: "paper" | "memo";
  memoId: string | null;
  fileKeys: string;
  fileUrl: string;
  originalFileName: string;
  uploadedAt: string;
  uploadedBy: string;
}
