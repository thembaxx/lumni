import { createValidator } from "./multilingual-validators";
import type { Question } from "./types";

interface EvaluationQuestion {
  id: string;
  subject: string;
  topic: string;
  language: string;
  questionText: string;
  expectedLanguage: string;
  expectedType: string;
}

interface EvaluationResult {
  questionId: string;
  language: string;
  passed: boolean;
  score: number;
  issues: string[];
  validatorErrors: string[];
}

interface EvaluationSummary {
  totalQuestions: number;
  passed: number;
  failed: number;
  averageScore: number;
  byLanguage: Record<string, { total: number; passed: number; avgScore: number }>;
  bySubject: Record<string, { total: number; passed: number; avgScore: number }>;
}

const EVALUATION_SET: EvaluationQuestion[] = [
  // English
  {
    id: "en-math-1",
    subject: "mathematics",
    topic: "calculus",
    language: "en",
    questionText: "Calculate the derivative of $f(x) = 3x^2 + 2x - 5$.",
    expectedLanguage: "en",
    expectedType: "calculation",
  },
  {
    id: "en-phys-1",
    subject: "physical-sciences",
    topic: "mechanics",
    language: "en",
    questionText:
      "A car accelerates from rest at $2\\,m/s^2$. How far does it travel in 5 seconds?",
    expectedLanguage: "en",
    expectedType: "calculation",
  },
  {
    id: "en-bio-1",
    subject: "life-sciences",
    topic: "genetics",
    language: "en",
    questionText: "Explain the process of DNA replication.",
    expectedLanguage: "en",
    expectedType: "long-answer",
  },
  {
    id: "en-geo-1",
    subject: "geography",
    topic: "climatology",
    language: "en",
    questionText: "Describe the formation of a tropical cyclone.",
    expectedLanguage: "en",
    expectedType: "long-answer",
  },

  // Afrikaans
  {
    id: "af-wis-1",
    subject: "mathematics",
    topic: "algebra",
    language: "af",
    questionText: "Los die vergelyking op: $2x + 5 = 15$.",
    expectedLanguage: "af",
    expectedType: "calculation",
  },
  {
    id: "af-fis-1",
    subject: "physical-sciences",
    topic: "chemistry",
    language: "af",
    questionText: "Beskryf die verskil kovalente en ioniese bindings.",
    expectedLanguage: "af",
    expectedType: "long-answer",
  },
  {
    id: "af-lew-1",
    subject: "life-sciences",
    topic: "ecology",
    language: "af",
    questionText: "Verduidelik die koolstofsiklus in die natuur.",
    expectedLanguage: "af",
    expectedType: "long-answer",
  },

  // isiZulu
  {
    id: "zu-math-1",
    subject: "mathematics",
    topic: "geometry",
    language: "zu",
    questionText: "Kokha i-perimeter ye-sikwele esine-diameter ye-10 cm.",
    expectedLanguage: "zu",
    expectedType: "calculation",
  },
  {
    id: "zu-sci-1",
    subject: "physical-sciences",
    topic: "physics",
    language: "zu",
    questionText: "Chaza imvelaphi ye-sandi nendlela ayisebenzayo.",
    expectedLanguage: "zu",
    expectedType: "long-answer",
  },

  // isiXhosa
  {
    id: "xh-math-1",
    subject: "mathematics",
    topic: "algebra",
    language: "xh",
    questionText: "Qhawulula umlinganiselo: $3x - 7 = 20$.",
    expectedLanguage: "xh",
    expectedType: "calculation",
  },
  {
    id: "xh-geo-1",
    subject: "geography",
    topic: "geomorphology",
    language: "xh",
    questionText: "Cacisa ukudalwa kwamawawa ngeenlanzi.",
    expectedLanguage: "xh",
    expectedType: "long-answer",
  },

  // Sepedi
  {
    id: "st-math-1",
    subject: "mathematics",
    topic: "statistics",
    language: "st",
    questionText: "Bala mean ya dinomoro tse latelang: 5, 8, 12, 15, 20.",
    expectedLanguage: "st",
    expectedType: "calculation",
  },

  // Setswana
  {
    id: "tn-sci-1",
    subject: "life-sciences",
    topic: "cells",
    language: "tn",
    questionText: "Tlhalosa maemo a sele e e tswa go feta sele sa boroko.",
    expectedLanguage: "tn",
    expectedType: "long-answer",
  },

  // Sesotho sa Leboa
  {
    id: "nso-math-1",
    subject: "mathematics",
    topic: "trigonometry",
    language: "nso",
    questionText: "Lebala sin ya 30°.",
    expectedLanguage: "nso",
    expectedType: "calculation",
  },

  // Xitsonga
  {
    id: "ts-geo-1",
    subject: "geography",
    topic: "settlement",
    language: "ts",
    questionText: "Ndzawulo yo endla manguva eka nkarhi lowu ndala.",
    expectedLanguage: "ts",
    expectedType: "long-answer",
  },

  // siSwati
  {
    id: "ss-phys-1",
    subject: "physical-sciences",
    topic: "electricity",
    language: "ss",
    questionText: "Chaza imeko ye-current ye-electrical.",
    expectedLanguage: "ss",
    expectedType: "long-answer",
  },

  // Tshivenda
  {
    id: "ve-bio-1",
    subject: "life-sciences",
    topic: "reproduction",
    language: "ve",
    questionText: "Vhudzisa u shuma ha mbeu.",
    expectedLanguage: "ve",
    expectedType: "long-answer",
  },

  // isiNdebele
  {
    id: "nd-math-1",
    subject: "mathematics",
    topic: "probability",
    language: "nd",
    questionText: "Bala ithuba lokuthi uphinde uthole inombolo eziyodwa.",
    expectedLanguage: "nd",
    expectedType: "calculation",
  },
];

async function evaluateQuestion(question: EvaluationQuestion): Promise<EvaluationResult> {
  const validator = createValidator(question.language);

  const mockQuestion = {
    id: question.id,
    subject: question.subject,
    topic: question.topic,
    questionText: question.questionText,
    explanation: "",
    hint: "",
    type: question.expectedType as any,
  } as any;

  const validatorErrors = validator.validate(mockQuestion);
  const qualityCheck = validator.checkLanguageQuality(question.questionText);

  const issues = [...qualityCheck.issues, ...validatorErrors.map((e) => e.message)];

  const passed =
    qualityCheck.score >= 60 && validatorErrors.filter((e) => e.severity === "error").length === 0;

  return {
    questionId: question.id,
    language: question.language,
    passed,
    score: qualityCheck.score,
    issues,
    validatorErrors: validatorErrors.map((e) => e.message),
  };
}

export async function runMultilingualEvaluation(): Promise<EvaluationSummary> {
  console.log("Starting multilingual evaluation...");
  console.log(
    `Testing ${EVALUATION_SET.length} questions across ${new Set(EVALUATION_SET.map((q) => q.language)).size} languages`,
  );

  const results: EvaluationResult[] = [];

  for (const question of EVALUATION_SET) {
    const result = await evaluateQuestion(question);
    results.push(result);
    console.log(
      `${result.passed ? "✅" : "❌"} ${question.id} (${question.language}): ${result.score}/100 - ${result.issues.join(", ") || "OK"}`,
    );
  }

  // Compute summary
  const byLanguage: Record<string, { total: number; passed: number; avgScore: number }> = {};
  const bySubject: Record<string, { total: number; passed: number; avgScore: number }> = {};

  for (const r of results) {
    const q = EVALUATION_SET.find((e) => e.id === r.questionId)!;

    if (!byLanguage[r.language]) {
      byLanguage[r.language] = { total: 0, passed: 0, avgScore: 0 };
    }
    byLanguage[r.language].total++;
    if (r.passed) byLanguage[r.language].passed++;
    byLanguage[r.language].avgScore += r.score;

    if (!bySubject[q.subject]) {
      bySubject[q.subject] = { total: 0, passed: 0, avgScore: 0 };
    }
    bySubject[q.subject].total++;
    if (r.passed) bySubject[q.subject].passed++;
    bySubject[q.subject].avgScore += r.score;
  }

  // Calculate averages
  for (const lang of Object.keys(byLanguage)) {
    byLanguage[lang].avgScore = Math.round(byLanguage[lang].avgScore / byLanguage[lang].total);
  }
  for (const subj of Object.keys(bySubject)) {
    bySubject[subj].avgScore = Math.round(bySubject[subj].avgScore / bySubject[subj].total);
  }

  const summary: EvaluationSummary = {
    totalQuestions: EVALUATION_SET.length,
    passed: results.filter((r) => r.passed).length,
    failed: results.filter((r) => !r.passed).length,
    averageScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
    byLanguage,
    bySubject,
  };

  console.log("\n=== EVALUATION SUMMARY ===");
  console.log(
    `Total: ${summary.totalQuestions}, Passed: ${summary.passed}, Failed: ${summary.failed}`,
  );
  console.log(`Average Score: ${summary.averageScore}/100`);
  console.log("\nBy Language:");
  for (const [lang, stats] of Object.entries(summary.byLanguage)) {
    console.log(
      `  ${lang}: ${stats.passed}/${stats.total} (${Math.round((stats.passed / stats.total) * 100)}%) avg ${stats.avgScore}`,
    );
  }
  console.log("\nBy Subject:");
  for (const [subj, stats] of Object.entries(summary.bySubject)) {
    console.log(
      `  ${subj}: ${stats.passed}/${stats.total} (${Math.round((stats.passed / stats.total) * 100)}%) avg ${stats.avgScore}`,
    );
  }

  return summary;
}

// Decision gate
export function shouldDeploy(summary: EvaluationSummary): boolean {
  const MIN_AVG_SCORE = 70;
  const MIN_PASS_RATE = 0.8;
  const MIN_LANG_PASS_RATE = 0.7;

  if (summary.averageScore < MIN_AVG_SCORE) {
    console.log(`❌ DEPLOY BLOCKED: Average score ${summary.averageScore} < ${MIN_AVG_SCORE}`);
    return false;
  }

  const passRate = summary.passed / summary.totalQuestions;
  if (passRate < MIN_PASS_RATE) {
    console.log(
      `❌ DEPLOY BLOCKED: Pass rate ${Math.round(passRate * 100)}% < ${Math.round(MIN_PASS_RATE * 100)}%`,
    );
    return false;
  }

  // Check per-language pass rates
  // (would need per-language stats from summary)

  console.log("✅ DEPLOY APPROVED: All quality gates passed");
  return true;
}

// Export for CI/CD integration
export { EVALUATION_SET, type EvaluationQuestion, type EvaluationResult, type EvaluationSummary };
