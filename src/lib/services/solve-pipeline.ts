import type { AIClient } from "@/lib/ai/client";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";
import { HttpError } from "@/lib/api/create-route-handler";
import { buildPromptInstruction, getSourceForQuestion } from "@/lib/tinyfish";
import { isMathSubject, solveWithToolAgent } from "@/lib/solver/math-solver";
import { logError } from "@/lib/shared/logger";

export interface SolverSource {
  url: string;
  title: string;
}

export interface SolverResult {
  solution: string;
  steps: string[];
  provider: string;
  sources?: SolverSource[];
}

export interface FollowUpResult {
  answer: string;
  provider: string;
}

export interface SolveBody {
  question?: string;
  imageUrl?: string;
  mode?: string;
  subject?: string;
  context?: { role: string; content: string }[];
  followUp?: boolean;
}

interface WebContext {
  sources: { url: string; title: string }[];
  xml: string;
  domainsQueried: string[];
}

const SUBJECT_PROMPTS: Record<string, string> = {
  algebra:
    "You are an expert Algebra tutor for South African Matric students. Solve equations, inequalities, polynomials, systems, factoring, sequences, and functions. Show factoring steps, quadratic formula, or substitution methods where applicable. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  calculus:
    "You are an expert Calculus tutor for South African Matric students. Solve limits, derivatives, integrals, differential equations, and optimization problems. Show differentiation/integration rules and intermediate simplifications. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  trigonometry:
    "You are an expert Trigonometry tutor for South African Matric students. Solve trig equations, verify identities, evaluate trig functions, and work with radians/degrees. Show identity transformations and unit circle reasoning. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  statistics:
    "You are an expert Statistics tutor for South African Matric students. Solve probability, mean/median/mode, standard deviation, distributions, and data analysis problems. Show formulas and intermediate calculations. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  matrix:
    "You are an expert Matrix/Linear Algebra tutor for South African Matric students. Solve matrix operations, determinants, inverses, systems of equations via matrices, and transformations. Show row operations and intermediate matrix states. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  "pre-algebra":
    "You are an expert Pre-Algebra tutor for South African Matric students. Solve arithmetic, fractions, decimals, percentages, exponents, radicals, ratios, and proportions. Show step-by-step arithmetic and simplification. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
  geometry:
    "You are an expert Geometry tutor for South African Matric students. Solve area, volume, perimeter, angles, coordinate geometry, similarity, and congruence problems. Show formula application and diagram reasoning. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.",
};

function emptyRagContext(): WebContext {
  return { sources: [], xml: "", domainsQueried: [] };
}

function resolveSystemPrompt(
  mode: string,
  followUp: boolean | undefined,
  subjectKey: string | null,
): string {
  if (mode === "extract") {
    return "You are an expert at reading math problems from images. Extract the exact math problem shown in the image. Return the problem text using LaTeX notation for all mathematical expressions (e.g., $x^2 + 2x + 1 = 0$, $\\int_0^1 x^2 \\, dx$, $\\frac{a}{b}$). Do NOT solve the problem. Format your response as a JSON object with 'solution' (the extracted problem text in LaTeX) and 'steps' (an empty array).";
  }
  if (followUp) {
    return "You are a helpful tutor. The student is asking a follow-up question about a problem you previously helped them with. Answer their follow-up conversationally and concisely. No JSON \u2014 just plain text.";
  }
  if (subjectKey) return SUBJECT_PROMPTS[subjectKey];
  return "You are an expert tutor for South African Matric students. Solve the provided problem and provide a clear, step-by-step explanation. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.";
}

function resolveUserPrompt(
  mode: string,
  followUp: boolean | undefined,
  question: string | undefined,
  context: { role: string; content: string }[] | undefined,
): string {
  if (mode === "extract") return "Extract the math problem from this image.";
  if (followUp) {
    return [
      "Previous conversation:",
      ...(context || []).map((c) => `${c.role === "user" ? "Student" : "Tutor"}: ${c.content}`),
      `Student follow-up: ${question || ""}`,
      "Answer the student's follow-up question concisely.",
    ].join("\n");
  }
  return question || "Solve the problem in the attached image.";
}

function parseSolverResponse(
  content: string,
  sources: { url: string; title: string }[],
  provider: string,
): SolverResult {
  const cleaned = cleanResponse(content);
  try {
    const solved = JSON.parse(cleaned);
    return {
      solution: solved.solution,
      steps: solved.steps,
      provider,
      sources: sources.map((s) => ({ url: s.url, title: s.title })),
    };
  } catch {
    return {
      solution: content,
      steps: [],
      provider,
      sources: sources.map((s) => ({ url: s.url, title: s.title })),
    };
  }
}

function assertAIResponse(result: unknown, isImageMode: boolean): asserts result is AIResponse {
  if (!result || typeof result !== "object") {
    throw new HttpError(500, "AI solver returned an invalid response");
  }
  const r = result as Record<string, unknown>;
  if ("available" in r && !r.available) {
    const errorMsg = "error" in r ? (r.error as string) : "Unknown error";
    if (isImageMode) {
      throw new HttpError(
        400,
        `Could not read the image. Only Gemini supports image processing, and it was unavailable: ${errorMsg}. Please type the problem text instead.`,
      );
    }
    throw new HttpError(500, `AI solver failed: ${errorMsg}`);
  }
}

export interface SolvePipelineDeps {
  ai: AIClient;
  getSourceForQuestion: typeof getSourceForQuestion;
  buildPromptInstruction: typeof buildPromptInstruction;
}

export class SolvePipeline {
  private deps: SolvePipelineDeps;

  constructor(deps: SolvePipelineDeps) {
    this.deps = deps;
  }

  async execute(body: SolveBody, userId?: string | null): Promise<SolverResult | FollowUpResult> {
    const { question, imageUrl, mode = "solve", subject, context, followUp } = body;

    const isImageMode = !!imageUrl;
    const subjectKey = subject && SUBJECT_PROMPTS[subject] ? subject : null;
    const baseSystemPrompt = resolveSystemPrompt(mode, followUp, subjectKey);
    const userPrompt = resolveUserPrompt(mode, followUp, question, context);
    const shouldFetchSources = mode !== "extract" && !followUp && !!question?.trim();

    const webContext: WebContext = shouldFetchSources
      ? await this.safeFetchSources(question as string, userId)
      : emptyRagContext();

    const systemPrompt = webContext.xml
      ? `${baseSystemPrompt}\n\n${this.deps.buildPromptInstruction()}`
      : baseSystemPrompt;

    const finalUserPrompt = webContext.xml
      ? `${webContext.xml}\n\n---\n\n${userPrompt}`
      : userPrompt;

    if (!isImageMode && !followUp && mode === "solve" && isMathSubject(subjectKey || subject)) {
      return solveWithToolAgent(finalUserPrompt, this.deps.ai, subjectKey || subject, {
        temperature: 0.5,
        maxSteps: 10,
      });
    }

    const result = await this.deps.ai.generateWithSystem(systemPrompt, finalUserPrompt, {
      temperature: isImageMode && mode === "solve" ? 0.3 : 0.7,
      maxTokens: 4000,
      imageUrl,
    });

    assertAIResponse(result, isImageMode);

    if (followUp) {
      return { answer: result.content, provider: result.provider };
    }

    return parseSolverResponse(result.content, webContext.sources, result.provider);
  }

  private async safeFetchSources(q: string, uid?: string | null): Promise<WebContext> {
    try {
      return await this.deps.getSourceForQuestion({
        question: q,
        userId: uid ?? undefined,
      });
    } catch (err) {
      logError("AiSolverFetchSources", err);
      return emptyRagContext();
    }
  }
}
