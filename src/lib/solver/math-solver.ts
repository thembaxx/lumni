import { ToolLoopAgent, isStepCount, tool } from "ai";
import { z } from "zod";
import type { AIClient } from "@/lib/ai/client";
import { cleanResponse } from "@/lib/ai/parse-response";
import { evaluate } from "./evaluator";
import type { SolverResult } from "@/lib/services/solve-pipeline";
import { logError } from "@/lib/shared/logger";

const calculateParams = z.object({
  expression: z
    .string()
    .describe("The mathematical expression to evaluate, e.g. '2 + 3 * 4', 'sqrt(16)', 'sin(pi/2)'"),
});

const calculateTool = tool({
  description:
    "Evaluate a mathematical expression. Supports: +, -, *, /, ^ (exponent), pi, e, sqrt(), ln(), log(), abs(), sin(), cos(), tan(), round(), floor(), ceil(). Use ^ for exponentiation. Example: '2 + 3 * 4', 'sqrt(pi * 5^2)', 'sin(pi/2)'.",
  inputSchema: calculateParams,
  execute: async (args: z.infer<typeof calculateParams>) => {
    const result = evaluate(args.expression);
    return { expression: args.expression, result };
  },
});

const SOLVER_INSTRUCTIONS = `You are an expert math tutor for South African Matric students. Your goal is to solve the user's math problem step-by-step.

You have access to a 'calculate' tool that evaluates mathematical expressions. Use it to verify your arithmetic at each step.

For every step:
1. Think through the approach
2. Use the calculate tool to compute intermediate values
3. Explain what you're doing

After solving, provide the final answer. Keep explanations clear and concise, using $...$ for inline math and $$...$$ for display math.`;

const MATH_SUBJECTS = new Set([
  "algebra",
  "calculus",
  "trigonometry",
  "statistics",
  "matrix",
  "pre-algebra",
  "geometry",
  "mathematics",
  "math",
  "maths",
  "mathematical-literacy",
  "math-lit",
]);

export function isMathSubject(subject?: string): boolean {
  if (!subject) return false;
  return MATH_SUBJECTS.has(subject.toLowerCase().replace(/\s+/g, "-"));
}

export function getMathSystemPrompt(subject: string): string {
  const subjectLabels: Record<string, string> = {
    algebra: "Algebra",
    calculus: "Calculus",
    trigonometry: "Trigonometry",
    statistics: "Statistics",
    matrix: "Matrix/Linear Algebra",
    "pre-algebra": "Pre-Algebra",
    geometry: "Geometry",
    mathematics: "General Mathematics",
    "mathematical-literacy": "Mathematical Literacy",
    "math-lit": "Mathematical Literacy",
  };

  const label = subjectLabels[subject.toLowerCase()] || "Mathematics";
  return `You are an expert ${label} tutor for South African Matric students. Solve the provided problem using step-by-step reasoning. Use the 'calculate' tool to compute intermediate values. Provide the final answer with $...$ for inline math and $$...$$ for display math.`;
}

export interface MathSolverConfig {
  maxSteps?: number;
  temperature?: number;
}

export async function solveWithToolAgent(
  question: string,
  ai: AIClient,
  subject?: string,
  config?: MathSolverConfig,
): Promise<SolverResult> {
  const maxSteps = config?.maxSteps ?? 10;
  const temperature = config?.temperature ?? 0.5;

  const modelRef = ai.getModelRef()?.model;
  if (!modelRef) {
    throw new Error("No AI model configured");
  }

  const instructions = subject ? getMathSystemPrompt(subject) : SOLVER_INSTRUCTIONS;

  const agent = new ToolLoopAgent({
    model: modelRef,
    tools: { calculate: calculateTool },
    instructions,
    stopWhen: isStepCount(maxSteps),
    temperature,
  });

  try {
    const result = await agent.generate({ prompt: question });

    const text = result.text;

    let solution: string;
    let steps: string[];

    try {
      const cleaned = cleanResponse(text);
      const parsed = JSON.parse(cleaned);
      solution = parsed.solution || text;
      steps = parsed.steps || [text];
    } catch {
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      const stepLines = lines.filter((l) => /^\d+[.)]|Step\s+\d+/i.test(l));
      if (stepLines.length > 0) {
        steps = stepLines;
        solution = lines[lines.length - 1] || text;
      } else {
        solution = text;
        steps = [text];
      }
    }

    return {
      solution,
      steps,
      provider: "tool-agent",
    };
  } catch (err) {
    logError("MathSolver.toolAgent", err);
    const fallbackAgent = new ToolLoopAgent({
      model: modelRef,
      tools: {},
      instructions: instructions,
      stopWhen: isStepCount(5),
      temperature: 0.7,
    });
    const fallback = await fallbackAgent.generate({
      prompt: `Solve this step by step: ${question}`,
    });
    return {
      solution: fallback.text,
      steps: [fallback.text],
      provider: "tool-agent-fallback",
    };
  }
}
