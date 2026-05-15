import { NextRequest, NextResponse } from "next/server";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

const SUBJECT_PROMPTS: Record<string, string> = {
	algebra:
		"You are an expert Algebra tutor for South African Matric students. Solve equations, inequalities, polynomials, systems, factoring, sequences, and functions. Show factoring steps, quadratic formula, or substitution methods where applicable. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	calculus:
		"You are an expert Calculus tutor for South African Matric students. Solve limits, derivatives, integrals, differential equations, and optimization problems. Show differentiation/integration rules and intermediate simplifications. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	trigonometry:
		"You are an expert Trigonometry tutor for South African Matric students. Solve trig equations, verify identities, evaluate trig functions, and work with radians/degrees. Show identity transformations and unit circle reasoning. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	statistics:
		"You are an expert Statistics tutor for South African Matric students. Solve probability, mean/median/mode, standard deviation, distributions, and data analysis problems. Show formulas and intermediate calculations. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	matrix:
		"You are an expert Matrix/Linear Algebra tutor for South African Matric students. Solve matrix operations, determinants, inverses, systems of equations via matrices, and transformations. Show row operations and intermediate matrix states. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	"pre-algebra":
		"You are an expert Pre-Algebra tutor for South African Matric students. Solve arithmetic, fractions, decimals, percentages, exponents, radicals, ratios, and proportions. Show step-by-step arithmetic and simplification. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
	geometry:
		"You are an expert Geometry tutor for South African Matric students. Solve area, volume, perimeter, angles, coordinate geometry, similarity, and congruence problems. Show formula application and diagram reasoning. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).",
};

export const POST = withRateLimit(async (req: NextRequest) => {
	try {
		const { question, imageUrl, mode = "solve", subject } = await req.json();

		if (!question && !imageUrl) {
			return NextResponse.json(
				{ error: "Either question text or image is required" },
				{ status: 400 },
			);
		}

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
				deepseekApiKey: process.env.DEEPSEEK_API_KEY,
			});
		}

		if (!isAIConfigured()) {
			return NextResponse.json(
				{
					error: "AI not configured",
					message: "Please configure at least one AI provider API key",
				},
				{ status: 503 },
			);
		}

		const isImageMode = !!imageUrl;
		const subjectKey = subject && SUBJECT_PROMPTS[subject] ? subject : null;
		const systemPrompt =
			mode === "extract"
				? "You are an expert at reading math problems from images. Extract the exact math problem shown in the image. Return the problem text as-is — do not solve it. Format your response as a JSON object with 'solution' (the extracted problem text) and 'steps' (an empty array)."
				: subjectKey
					? SUBJECT_PROMPTS[subjectKey]
					: "You are an expert tutor for South African Matric students. Solve the provided problem and provide a clear, step-by-step explanation. Format your response as a JSON object with 'solution' (string) and 'steps' (array of strings).";
		const userPrompt =
			mode === "extract"
				? "Extract the math problem from this image."
				: question || "Solve the problem in the attached image.";

		const result = await generateWithSystem(systemPrompt, userPrompt, {
			temperature: isImageMode && mode === "solve" ? 0.3 : 0.7,
			maxTokens: 4000,
			imageUrl,
		});

		if ("available" in result && !result.available) {
			const errorMsg = "error" in result ? result.error : "Unknown error";
			throw new Error(`AI solver failed: ${errorMsg}`);
		}

		const response = result as AIResponse;
		const cleaned = cleanResponse(response.content);

		try {
			const solved = JSON.parse(cleaned);
			return NextResponse.json({
				solution: solved.solution,
				steps: solved.steps,
				provider: response.provider,
			});
		} catch {
			return NextResponse.json({
				solution: response.content,
				steps: [],
				provider: response.provider,
			});
		}
	} catch (error) {
		console.error("AI Solver error:", error);
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to solve the problem",
			},
			{ status: 500 },
		);
	}
});
