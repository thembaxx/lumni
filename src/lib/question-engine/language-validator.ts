import { getLanguageConfig } from "./multilingual-prompt-manager";
import type { Question } from "./types";

interface ValidationError {
  type: "schema" | "quality" | "consistency" | "content" | "language";
  field: string;
  message: string;
  severity: "error" | "warning";
}

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  score: number;
}

interface QualityCheckResult {
  score: number;
  issues: string[];
}

export class LanguageQualityValidator {
  private languageCode: string;
  private config: ReturnType<typeof getLanguageConfig>;
  private commonWords: Set<string>;

  constructor(languageCode: string) {
    this.languageCode = languageCode;
    this.config = getLanguageConfig(languageCode);
    this.commonWords = this.getCommonWords(languageCode);
  }

  validate(question: Question): ValidationError[] {
    const errors: ValidationError[] = [];

    // Schema validation
    if (!question.questionText || question.questionText.trim().length < 10) {
      errors.push({
        type: "schema",
        field: "questionText",
        message: "Question text is too short or missing",
        severity: "error",
      });
    }

    if (!question.explanation || question.explanation.trim().length < 20) {
      errors.push({
        type: "schema",
        field: "explanation",
        message: "Explanation is too short or missing",
        severity: "warning",
      });
    }

    if (!question.hint || question.hint.trim().length < 10) {
      errors.push({
        type: "schema",
        field: "hint",
        message: "Hint is too short or missing",
        severity: "warning",
      });
    }

    // Language quality checks
    const qualityCheck = this.checkLanguageQuality(question.questionText);
    for (const issue of qualityCheck.issues) {
      errors.push({
        type: "language",
        field: "questionText",
        message: issue,
        severity: "warning",
      });
    }

    return errors;
  }

  checkLanguageQuality(text: string): QualityCheckResult {
    const issues: string[] = [];
    let score = 100;

    if (!text || text.trim().length === 0) {
      return { score: 0, issues: ["Empty text"] };
    }

    // Check for target language indicators
    const langScore = this.detectLanguage(text);
    if (langScore < 0.3) {
      issues.push(
        `Low ${this.config.name} language detection confidence (${Math.round(langScore * 100)}%)`,
      );
      score -= 30;
    }

    // Check for English contamination (if not English)
    if (this.languageCode !== "en") {
      const englishWords = this.countEnglishWords(text);
      if (englishWords > 3) {
        issues.push(`Contains ${englishWords} English words (possible contamination)`);
        score -= englishWords * 5;
      }
    }

    // Check for common language-specific patterns
    const patternScore = this.checkLanguagePatterns(text);
    score -= patternScore.penalty;
    issues.push(...patternScore.issues);

    // Check for math notation consistency
    const mathScore = this.checkMathNotation(text);
    score -= mathScore.penalty;
    issues.push(...mathScore.issues);

    // Check for proper punctuation for the language
    const punctScore = this.checkPunctuation(text);
    score -= punctScore.penalty;
    issues.push(...punctScore.issues);

    return { score: Math.max(0, score), issues };
  }

  private detectLanguage(text: string): number {
    // Simple language detection based on common words
    const words = text.toLowerCase().split(/\s+/);
    if (words.length === 0) return 0;

    let matches = 0;
    for (const word of words) {
      if (this.commonWords.has(word)) matches++;
    }
    return matches / words.length;
  }

  private countEnglishWords(text: string): number {
    const commonEnglish = new Set([
      "the",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "a",
      "an",
      "the",
      "this",
      "that",
      "these",
      "those",
      "it",
      "its",
      "they",
      "them",
      "their",
      "what",
      "which",
      "who",
      "when",
      "where",
      "why",
      "how",
      "can",
      "could",
      "should",
      "would",
      "will",
      "would",
      "may",
      "might",
      "must",
      "shall",
      "should",
      "need",
      "want",
      "like",
      "use",
    ]);

    const words = text.toLowerCase().split(/\s+/);
    let count = 0;
    for (const word of words) {
      if (commonEnglish.has(word)) count++;
    }
    return count;
  }

  private checkLanguagePatterns(text: string): { penalty: number; issues: string[] } {
    const issues: string[] = [];
    let penalty = 0;

    if (this.languageCode === "af") {
      // Afrikaans patterns
      if (!/\b(die|en|van|in|op|vir|met|op|onder|bo|na|by|uit)\b/i.test(text)) {
        issues.push("Missing common Afrikaans function words");
        penalty += 10;
      }
      if (!/\b(het|is|was|sal|kan|moet|wil)\b/i.test(text)) {
        issues.push("Missing common Afrikaans auxiliary verbs");
        penalty += 5;
      }
    } else if (this.languageCode === "zu") {
      // isiZulu patterns
      if (!/\b(um|aba|imi|ezi|ama|izim|iz|ez|oku|kwa|ngu|ngi|u|ba|li|lu|bu|ku)\b/i.test(text)) {
        issues.push("Missing common isiZulu noun class prefixes");
        penalty += 10;
      }
    } else if (this.languageCode === "xh") {
      if (!/\b(um|aba|imi|ezi|ama|izim|iz|ez|oku|kwa|ngu|ngi|u|ba|li|lu|bu|ku)\b/i.test(text)) {
        issues.push("Missing common isiXhosa noun class prefixes");
        penalty += 10;
      }
    }

    return { penalty: Math.min(penalty, 30), issues };
  }

  private checkMathNotation(text: string): { penalty: number; issues: string[] } {
    const issues: string[] = [];
    let penalty = 0;

    // Check for proper LaTeX math notation
    const latexCount = (text.match(/\$[^$]+\$/g) || []).length;
    const hasMathTerms =
      /(calculate|derivative|integral|solve|equation|formula|function|graph|area|volume|perimeter|angle|triangle|circle|square|rectangle)/i.test(
        text,
      );

    if (hasMathTerms && latexCount === 0) {
      issues.push("Mathematical content detected but no LaTeX notation ($...$) found");
      penalty += 15;
    }

    // Check for inconsistent math notation
    if (text.includes("^") && !text.includes("$")) {
      issues.push("Exponent notation (^) found without LaTeX delimiters");
      penalty += 5;
    }

    return { penalty: Math.min(penalty, 20), issues };
  }

  private checkPunctuation(text: string): { penalty: number; issues: string[] } {
    const issues: string[] = [];
    let penalty = 0;

    // Check for sentence ending punctuation
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    if (sentences.length > 1) {
      const withoutEnding = sentences.filter((s) => !/[.!?]$/.test(s.trim())).length;
      if (withoutEnding > sentences.length * 0.5) {
        issues.push("Many sentences missing ending punctuation");
        penalty += 10;
      }
    }

    // Language-specific punctuation
    if (this.languageCode === "af" && text.includes("...")) {
      issues.push("Afrikaans typically uses '...' differently");
      penalty += 2;
    }

    return { penalty: Math.min(penalty, 15), issues };
  }

  private getCommonWords(languageCode: string): Set<string> {
    const commonWordsMap: Record<string, string[]> = {
      en: [
        "the",
        "and",
        "is",
        "in",
        "to",
        "of",
        "a",
        "for",
        "with",
        "on",
        "at",
        "by",
        "from",
        "as",
        "be",
        "are",
        "this",
        "that",
        "it",
        "have",
        "has",
        "was",
        "were",
      ],
      af: [
        "die",
        "en",
        "van",
        "in",
        "op",
        "vir",
        "met",
        "op",
        "onder",
        "bo",
        "na",
        "by",
        "uit",
        "is",
        "was",
        "sal",
        "kan",
        "moet",
        "wil",
        "het",
        "nie",
        "sy",
        "hy",
        "ons",
        "jy",
        "my",
        "jou",
        "hom",
        "haar",
        "ons",
        "hulle",
      ],
      zu: [
        "um",
        "aba",
        "imi",
        "ezi",
        "ama",
        "izim",
        "iz",
        "ez",
        "oku",
        "kwa",
        "ngu",
        "ngi",
        "u",
        "ba",
        "li",
        "lu",
        "bu",
        "ku",
        "no",
        "na",
        "ne",
        "kodwa",
        "futhi",
        "noma",
        "uma",
        "ngoba",
        "nje",
        "kahle",
        "kakhulu",
      ],
      xh: [
        "um",
        "aba",
        "imi",
        "ezi",
        "ama",
        "izim",
        "iz",
        "ez",
        "oku",
        "kwa",
        "ngu",
        "ngi",
        "u",
        "ba",
        "li",
        "lu",
        "bu",
        "ku",
        "no",
        "na",
        "ne",
        "kodwa",
        "kwaye",
        "nokuba",
        "xa",
        "ngoba",
        "njalo",
        "kakuhle",
        "kakhulu",
      ],
      st: [
        "le",
        "ba",
        "me",
        "ma",
        "se",
        "bo",
        "di",
        "tse",
        "ke",
        "ya",
        "a",
        "e",
        "o",
        "le",
        "ka",
        "ho",
        "ha",
        "le",
        "ka",
        "mo",
        "o",
        "re",
        "ts",
        "e",
        "nt",
        "ng",
        "mm",
        "ny",
        "ph",
        "tl",
        "ts",
        "kg",
        "kh",
        "tsh",
        "tj",
        "pj",
        "tjh",
      ],
      tn: [
        "le",
        "ba",
        "ma",
        "a",
        "e",
        "o",
        "go",
        "re",
        "wa",
        "ya",
        "e",
        "a",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
      ],
      nso: [
        "le",
        "ba",
        "ma",
        "a",
        "e",
        "o",
        "go",
        "re",
        "wa",
        "ya",
        "e",
        "a",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
      ],
      ts: [
        "hi",
        "va",
        "ma",
        "a",
        "i",
        "u",
        "ku",
        "hi",
        "ri",
        "va",
        "ya",
        "e",
        "a",
        "e",
        "e",
        "e",
        "e",
        "e",
        "e",
      ],
      ss: [
        "li",
        "ema",
        "ti",
        "lu",
        "bu",
        "ku",
        "si",
        "ni",
        "ba",
        "a",
        "e",
        "o",
        "u",
        "wa",
        "ya",
        "e",
        "e",
        "e",
        "e",
      ],
      ve: [
        "vha",
        "vhu",
        "ma",
        "a",
        "i",
        "u",
        "li",
        "ma",
        "vha",
        "vhu",
        "a",
        "i",
        "u",
        "a",
        "e",
        "o",
        "u",
      ],
      nd: [
        "ama",
        "aba",
        "izi",
        "izi",
        "ama",
        "ama",
        "ama",
        "a",
        "i",
        "u",
        "wa",
        "ya",
        "e",
        "e",
        "e",
        "e",
      ],
    };

    return new Set(commonWordsMap[this.languageCode] || commonWordsMap.en);
  }
}

export function createValidator(languageCode: string): LanguageQualityValidator {
  return new LanguageQualityValidator(languageCode);
}
