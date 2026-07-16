import type { Question } from "./types";
import type { ValidationError } from "./types";

export interface LanguageValidator {
  validate(question: Question): ValidationError[];
  checkLanguageQuality(questionText: string): { score: number; issues: string[] };
}

const LANGUAGE_PATTERNS: Record<string, RegExp> = {
  af: /[a-zA-Z]+/,
  zu: /[a-zA-Z]+/,
  xh: /[a-zA-Z]+/,
  st: /[a-zA-Z]+/,
  tn: /[a-zA-Z]+/,
  nso: /[a-zA-Z]+/,
  ts: /[a-zA-Z]+/,
  ss: /[a-zA-Z]+/,
  ve: /[a-zA-Z]+/,
  nd: /[a-zA-Z]+/,
};

const STOP_WORDS: Record<string, string[]> = {
  af: ["die", "en", "van", "in", "vir", "met", "op", "te", "is", "wat"],
  zu: ["uma", "noma", "futhi", "kodwa", "ngoba", "ngaphandle", "lapho", " manje", "ke", "na"],
  xh: ["uba", "nokuba", "kodwa", "ngoba", "ngaphandle", "lapho", "manje", "ke", "na"],
  st: ["le", "ka", "ho", "ke", "ha", "leha", "mme", "kapa", "ntle", "mona"],
  tn: ["le", "ka", "go", "ke", "ga", "gore", "leha", "mme", "kapa", "ntle"],
  nso: ["le", "ka", "go", "ke", "ga", "gore", "leha", "mme", "kapa", "ntle"],
  ts: ["hi", "ka", "hi", "yi", "xa", "xo", "leha", "kana", "kapa", "manana"],
  ss: ["ngekutfola", "le", "na", "ngoba", "kodwa", "leha", "loko", "manje", "ke", "na"],
  ve: ["nga", "na", "nga", "uri", "zwi", "zwa", "naho", "kana", "kapa", "mme"],
  nd: ["uma", "noma", "futhi", "kodwa", "ngoba", "ngaphandle", "lapho", "manje", "ke", "na"],
};

function countLanguageWords(text: string, language: string): number {
  const words = text.toLowerCase().match(/[a-zA-Z]+/g) || [];
  const stopWords = STOP_WORDS[language] || [];
  return words.filter((w) => stopWords.includes(w)).length;
}

function detectLanguage(text: string): string {
  let bestLang = "en";
  let bestScore = 0;

  for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
    const score = countLanguageWords(text, lang);
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }
  return bestLang;
}

export class MultilingualValidator implements LanguageValidator {
  private targetLanguage: string;

  constructor(targetLanguage: string) {
    this.targetLanguage = targetLanguage;
  }

  validate(question: Question): ValidationError[] {
    const errors: ValidationError[] = [];
    const questionText = question.questionText;

    // Check if question is in target language
    const detectedLang = detectLanguage(questionText);
    if (detectedLang !== this.targetLanguage && this.targetLanguage !== "en") {
      errors.push({
        type: "content",
        field: "questionText",
        message: `Question appears to be in ${detectedLang} instead of ${this.targetLanguage}`,
        severity: "warning",
      });
    }

    // Check for minimum content length
    if (questionText.length < 20) {
      errors.push({
        type: "quality",
        field: "questionText",
        message: "Question text is too short",
        severity: "error",
      });
    }

    // Check for placeholder text
    const placeholderPatterns = [/\[.*?\]/, /\{.*?\}/, /TODO/i, /placeholder/i, /xxx/i, /\?\?\?/];

    for (const pattern of placeholderPatterns) {
      if (pattern.test(questionText)) {
        errors.push({
          type: "quality",
          field: "questionText",
          message: "Question contains placeholder text",
          severity: "warning",
        });
        break;
      }
    }

    // Check explanation language
    if (question.explanation) {
      const explLang = detectLanguage(question.explanation);
      if (explLang !== this.targetLanguage && this.targetLanguage !== "en") {
        errors.push({
          type: "content",
          field: "explanation",
          message: `Explanation appears to be in ${explLang} instead of ${this.targetLanguage}`,
          severity: "warning",
        });
      }
    }

    return errors;
  }

  checkLanguageQuality(questionText: string): { score: number; issues: string[] } {
    const issues: string[] = [];
    let score = 100;

    // Check language detection
    const detectedLang = detectLanguage(questionText);
    if (detectedLang !== this.targetLanguage && this.targetLanguage !== "en") {
      issues.push(`Detected language: ${detectedLang}, expected: ${this.targetLanguage}`);
      score -= 30;
    }

    // Check for common issues
    if (questionText.length < 30) {
      issues.push("Question text too short");
      score -= 20;
    }

    if (questionText.split(" ").length < 8) {
      issues.push("Question has very few words");
      score -= 15;
    }

    // Check for proper punctuation
    if (!/[.!?]$/.test(questionText.trim())) {
      issues.push("Question should end with punctuation");
      score -= 10;
    }

    // Check for math notation
    const mathCount = (questionText.match(/\$[^$]+\$/g) || []).length;
    if (mathCount === 0 && questionText.toLowerCase().includes("calculate")) {
      issues.push("Calculation question missing math notation");
      score -= 15;
    }

    return { score: Math.max(0, score), issues };
  }
}

export function createValidator(targetLanguage: string): LanguageValidator {
  return new MultilingualValidator(targetLanguage);
}

export { detectLanguage, countLanguageWords };
