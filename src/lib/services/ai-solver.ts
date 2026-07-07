import { generateWithSystem, getAI, ensureAI } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";
import { HttpError } from "@/lib/api/create-route-handler";
import { logError } from "@/lib/shared/logger";
import { buildPromptInstruction, getSourceForQuestion } from "@/lib/tinyfish";
import { isMathSubject, solveWithToolAgent } from "@/lib/solver/math-solver";

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

interface SolveBody {
  question?: string;
  imageUrl?: string;
  mode?: string;
  subject?: string;
  context?: { role: string; content: string }[];
  followUp?: boolean;
}

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

export interface AiSolverDeps {
  getSourceForQuestion?: typeof getSourceForQuestion;
  buildPromptInstruction?: typeof buildPromptInstruction;
}

export const aiSolver = {
  async execute(body: SolveBody, userId?: string | null, deps?: AiSolverDeps) {
    const { question, imageUrl, mode = "solve", subject, context, followUp } = body;

    const fetchSources = deps?.getSourceForQuestion ?? getSourceForQuestion;
    const buildInstruction = deps?.buildPromptInstruction ?? buildPromptInstruction;

    ensureAI();

    const isImageMode = !!imageUrl;
    const subjectKey = subject && SUBJECT_PROMPTS[subject] ? subject : null;
    const baseSystemPrompt =
      mode === "extract"
        ? "You are an expert at reading math problems from images. Extract the exact math problem shown in the image. Return the problem text using LaTeX notation for all mathematical expressions (e.g., $x^2 + 2x + 1 = 0$, $\\int_0^1 x^2 \\, dx$, $\\frac{a}{b}$). Do NOT solve the problem. Format your response as a JSON object with 'solution' (the extracted problem text in LaTeX) and 'steps' (an empty array)."
        : followUp
          ? "You are a helpful tutor. The student is asking a follow-up question about a problem you previously helped them with. Answer their follow-up conversationally and concisely. No JSON \u2014 just plain text."
          : subjectKey
            ? SUBJECT_PROMPTS[subjectKey]
            : "You are an expert tutor for South African Matric students. Solve the provided problem and provide a clear, step-by-step explanation. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings). Use $...$ for inline math and $$...$$ for display math in all responses.";

    const userPrompt =
      mode === "extract"
        ? "Extract the math problem from this image."
        : followUp
          ? [
              "Previous conversation:",
              ...(context || []).map(
                (c) => `${c.role === "user" ? "Student" : "Tutor"}: ${c.content}`,
              ),
              `Student follow-up: ${question || ""}`,
              "Answer the student's follow-up question concisely.",
            ].join("\n")
          : question || "Solve the problem in the attached image.";

    const shouldFetchSources = mode !== "extract" && !followUp && !!question?.trim();

    interface WebContext {
      sources: { url: string; title: string }[];
      xml: string;
      domainsQueried: string[];
    }

    const emptyRagContext = (): WebContext => ({
      sources: [],
      xml: "",
      domainsQueried: [],
    });

    const safeFetchSources = async (q: string, uid?: string | null): Promise<WebContext> => {
      try {
        return await fetchSources({ question: q, userId: uid ?? undefined });
      } catch (err) {
        logError("AiSolverFetchSources", err);
        return emptyRagContext();
      }
    };

    const webContext: WebContext = shouldFetchSources
      ? await safeFetchSources(question as string, userId)
      : emptyRagContext();

    const systemPrompt = webContext.xml
      ? `${baseSystemPrompt}\n\n${buildInstruction()}`
      : baseSystemPrompt;

    const finalUserPrompt = webContext.xml
      ? `${webContext.xml}\n\n---\n\n${userPrompt}`
      : userPrompt;

    const isMath =
      !isImageMode && !followUp && mode === "solve" && isMathSubject(subjectKey || subject);

    if (isMath) {
      return await solveWithToolAgent(finalUserPrompt, getAI(), subjectKey || subject, {
        temperature: 0.5,
        maxSteps: 10,
      });
    }

    const result = await generateWithSystem(systemPrompt, finalUserPrompt, {
      temperature: isImageMode && mode === "solve" ? 0.3 : 0.7,
      maxTokens: 4000,
      imageUrl,
    });

    if ("available" in result && !result.available) {
      const errorMsg = "error" in result ? result.error : "Unknown error";
      if (isImageMode) {
        throw new HttpError(
          400,
          `Could not read the image. Only Gemini supports image processing, and it was unavailable: ${errorMsg}. Please type the problem text instead.`,
        );
      }
      throw new HttpError(500, `AI solver failed: ${errorMsg}`);
    }

    const response = result as AIResponse;

    if (followUp) {
      return { answer: response.content, provider: response.provider };
    }

    const cleaned = cleanResponse(response.content);

    try {
      const solved = JSON.parse(cleaned);
      return {
        solution: solved.solution,
        steps: solved.steps,
        provider: response.provider,
        sources: webContext.sources.map((s) => ({
          url: s.url,
          title: s.title,
        })),
      };
    } catch (err) {
      logError("AiSolverParseResponse", err);
      return {
        solution: response.content,
        steps: [],
        provider: response.provider,
        sources: webContext.sources.map((s) => ({
          url: s.url,
          title: s.title,
        })),
      };
    }
  },
};
