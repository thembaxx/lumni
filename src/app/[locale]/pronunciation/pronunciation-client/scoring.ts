export interface WordScore {
  word: string;
  accuracy: number;
  isCorrect: boolean;
}

export interface PhonemeDetail {
  expected: string;
  actual: string;
  correct: boolean;
  position: number;
}

export interface AssessmentResult {
  overallScore: number;
  wordScores: WordScore[];
  fluencyScore: number;
  phonemeAccuracy: number;
  phonemeDetails: PhonemeDetail[];
}

export function calcAccuracy(wordScores: WordScore[]): number {
  if (wordScores.length === 0) return 0;
  return (wordScores.filter((w) => w.isCorrect).length / wordScores.length) * 100;
}
