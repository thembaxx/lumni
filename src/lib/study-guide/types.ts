export interface StudyGuideSection {
  title: string;
  content: string;
  keyPoints: string[];
}

export interface StudyGuide {
  sections: StudyGuideSection[];
  summary: string;
}

export interface CachedStudyGuide {
  key: string;
  guide: StudyGuide;
  subject: string;
  topic: string;
  createdAt: number;
  expiresAt: number;
}
