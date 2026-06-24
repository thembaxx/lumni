import { curriculumRegistry } from "@/curriculum";
import { generateWithSystem, initAI, isAIConfigured } from "@/lib/ai";
import { cleanResponse } from "@/lib/ai/parse-response";
import { HttpError } from "@/lib/api/create-route-handler";
import type { AIResponse } from "@/lib/ai/types";
import { logError } from "@/lib/shared/logger";

interface CuratedProblem {
  id: string;
  questionText: string;
  solution: string;
  steps: string[];
  difficulty: string;
  topic: string;
}

const SUBJECT_PROMPTS: Record<string, string> = {
  default: "Generate practice problems with complete step-by-step solutions.",
  mathematics:
    "Generate mathematics problems suitable for South African Matric (Grade 12) level. Include algebraic manipulations, calculus, trigonometry, geometry, or statistics as appropriate for the topic.",
  "technical-mathematics":
    "Generate technical mathematics problems for South African Matric (Grade 12) level. Focus on applied calculations, engineering contexts, and technical applications.",
  "mathematical-literacy":
    "Generate mathematical literacy problems for South African Matric (Grade 12) level. Focus on real-world contexts, data interpretation, and practical applications.",
  "physical-sciences":
    "Generate physical sciences problems for South African Matric (Grade 12) level. Include mechanics, electricity, chemistry, waves, or optics as appropriate for the topic.",
  "life-sciences":
    "Generate life sciences problems for South African Matric (Grade 12) level. Focus on genetics, evolution, human biology, ecology, or physiology as appropriate for the topic.",
  "information-technology":
    "Generate information technology problems for South African Matric (Grade 12) level. Include algorithms, data structures, programming logic, or system design.",
  "computer-applications-technology":
    "Generate CAT problems for South African Matric (Grade 12) level. Focus on practical computer applications, spreadsheets, databases, or networks.",
  accounting:
    "Generate accounting problems for South African Matric (Grade 12) level. Include financial statements, ledger entries, ratios, or tax calculations.",
  "business-studies":
    "Generate business studies problems for South African Matric (Grade 12) level. Focus on management, marketing, finance, or business environments.",
  economics:
    "Generate economics problems for South African Matric (Grade 12) level. Include supply and demand, macroeconomics, market structures, or fiscal policy.",
  geography:
    "Generate geography problems for South African Matric (Grade 12) level. Include mapwork, climatology, geomorphology, or population geography.",
};

const STEM_SUBJECTS = new Set([
  "mathematics",
  "technical-mathematics",
  "mathematical-literacy",
  "physical-sciences",
  "life-sciences",
  "agricultural-sciences",
  "technical-sciences",
  "information-technology",
  "computer-applications-technology",
  "electrical-technology",
  "civil-technology",
  "mechanical-technology",
  "engineering-graphics-and-design",
  "agricultural-management-practices",
  "agricultural-technology",
  "accounting",
  "business-studies",
  "economics",
  "geography",
  "design",
  "visual-arts",
]);

interface CuratedBody {
  subject: string;
  topic?: string;
  count?: number;
}

export const curatedProblemsService = {
  async execute(body: CuratedBody) {
    const { subject, topic, count = 5 } = body;

    if (!isAIConfigured()) {
      initAI({
        geminiApiKey: process.env.GEMINI_API_KEY,
        groqApiKey: process.env.GROQ_API_KEY,
      });
    }

    const curriculum = await curriculumRegistry.getSubject(subject);
    const topicInfo = topic ? await curriculumRegistry.getTopic(subject, topic) : null;
    const topicContext = topicInfo
      ? `Topic: ${topicInfo.name}${topicInfo.subtopics.length > 0 ? ` (subtopics: ${topicInfo.subtopics.map((st) => st.name).join(", ")})` : ""}`
      : curriculum
        ? `Available topics: ${curriculum.topics.map((t) => t.name).join(", ")}`
        : "";

    const subjectPrompt =
      SUBJECT_PROMPTS[subject] ||
      SUBJECT_PROMPTS[STEM_SUBJECTS.has(subject) ? "default" : "default"];
    const isSTEM = STEM_SUBJECTS.has(subject);

    const systemPrompt = `You are an expert tutor creating practice problems for South African Matric (Grade 12) students.
${subjectPrompt}
${topicContext}
${isSTEM ? "Include relevant formulas, steps, and final answers. Use LaTeX math notation ($$...$$ for display math, $...$ for inline) for any mathematical expressions." : "Include clear explanations and steps."}

For each problem, provide:
1. A clear question
2. A detailed solution
3. Step-by-step breakdown (each step should be a separate string in the steps array)

Format your response as a JSON array of objects, each with:
{
  "questionText": "the problem text",
  "solution": "the complete solution text",
  "steps": ["step 1", "step 2", ...],
  "difficulty": "Easy" | "Medium" | "Hard"
}

Generate exactly ${Math.min(count, 10)} problems at varying difficulty levels.`;

    const userPrompt = `Generate ${Math.min(count, 10)} ${subject} practice problems${topic ? ` for the topic "${topicInfo?.name || topic}"` : ""} with step-by-step solutions.`;

    const result = await generateWithSystem(systemPrompt, userPrompt, {
      temperature: 0.6,
      maxTokens: 8000,
    });

    if ("available" in result && !result.available) {
      const errorMsg = "error" in result ? result.error : "Unknown error";
      throw new HttpError(500, `AI generation failed: ${errorMsg}`);
    }

    const response = result as AIResponse;
    const cleaned = cleanResponse(response.content);

    let problems: Omit<CuratedProblem, "id">[];
    try {
      problems = JSON.parse(cleaned);
    } catch (err) {
      logError("CuratedProblems", err);
      return {
        problems: [
          {
            id: "1",
            questionText: response.content,
            solution: "See steps below.",
            steps: [],
            difficulty: "Medium",
            topic: topic || "General",
          },
        ],
        subject,
        topic: topic || "General",
      };
    }

    const curated: CuratedProblem[] = problems.map((p, i) => ({
      ...p,
      id: `${subject}-${topic || "general"}-${i + 1}-${Date.now()}`,
      topic: topic || "General",
    }));

    return {
      problems: curated,
      subject,
      topic: topic || "General",
      count: curated.length,
    };
  },
};
