import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import type { AIResponse } from "@/lib/ai/types";

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

export const aiSolver = {
	async execute(body: SolveBody) {
		const {
			question,
			imageUrl,
			mode = "solve",
			subject,
			context,
			followUp,
		} = body;

		if (!isAIConfigured()) {
			initAI({
				geminiApiKey: process.env.GEMINI_API_KEY,
				groqApiKey: process.env.GROQ_API_KEY,
			});
		}

		const isImageMode = !!imageUrl;
		const subjectKey = subject && SUBJECT_PROMPTS[subject] ? subject : null;
		const systemPrompt =
			mode === "extract"
				? "You are an expert at reading math problems from images. Extract the exact math problem shown in the image. Return the problem text as-is \u2014 do not solve it. Format your response as a JSON object with 'solution' (the extracted problem text) and 'steps' (an empty array)."
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
								(c) =>
									`${c.role === "user" ? "Student" : "Tutor"}: ${c.content}`,
							),
							`Student follow-up: ${question || ""}`,
							"Answer the student's follow-up question concisely.",
						].join("\n")
					: question || "Solve the problem in the attached image.";

		const result = await generateWithSystem(systemPrompt, userPrompt, {
			temperature: isImageMode && mode === "solve" ? 0.3 : 0.7,
			maxTokens: 4000,
			imageUrl,
		});

		if ("available" in result && !result.available) {
			const errorMsg = "error" in result ? result.error : "Unknown error";
			if (isImageMode) {
				throw new Error(
					`Could not read the image. Only Gemini supports image processing, and it was unavailable: ${errorMsg}. Please type the problem text instead.`,
				);
			}
			throw new Error(`AI solver failed: ${errorMsg}`);
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
			};
		} catch {
			return {
				solution: response.content,
				steps: [],
				provider: response.provider,
			};
		}
	},
};
