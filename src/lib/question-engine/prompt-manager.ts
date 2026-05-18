import {
	getCompetencyDescription,
	mapCompetencyToBloomList,
} from "./competency-mapper";
import type { GenerationParams, QuestionType } from "./types";

export interface PromptTemplate {
	system: string;
	user: string;
}

export class PromptManager {
	private buildCompetencyContext(params: GenerationParams): string {
		if (!params.topicCompetencyLevel) return "";

		const desc = getCompetencyDescription(params.topicCompetencyLevel);
		if (!desc) return "";

		const bloomTargets = mapCompetencyToBloomList(params.topicCompetencyLevel);
		const bloomStr = bloomTargets.join(", ");
		const score = params.topicCompetencyScore;
		const scoreStr = score !== undefined ? ` (score: ${score}%)` : "";
		const diffNote = params.suggestedDifficulty
			? ` The difficulty has been set to ${params.suggestedDifficulty} based on current proficiency.`
			: "";

		return `\n\nStudent context: The student has a ${params.topicCompetencyLevel} understanding of this topic${scoreStr} — ${desc}. Focus on the following Bloom's taxonomy levels: ${bloomStr}.${diffNote}`;
	}

	getPrompt(
		type: QuestionType | "any",
		params: GenerationParams,
	): PromptTemplate {
		const difficulty =
			params.suggestedDifficulty ?? params.difficulty ?? "Medium";
		const subject = params.subject;
		const topic = params.topic ? ` on the topic: ${params.topic}` : "";
		const bloom = params.suggestedBloomLevel ?? params.bloomLevel;
		const bloomStr = bloom ? `. Bloom's taxonomy level: ${bloom}` : "";
		const unit = params.curriculumUnit
			? `. Curriculum unit: ${params.curriculumUnit}`
			: "";
		const count = params.count;
		const studentCtx = this.buildCompetencyContext(params);

		if (type === "any") {
			return {
				system: `You are an expert educational question generator for ${subject}. Generate a diverse mix of question types appropriate for the subject. Choose the most suitable type for each question based on what is being tested.`,
				user: `Generate ${count} questions for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Return a JSON array. Each question must have: id (unique string like "q1"), type (the question type), subject, topic, difficulty, bloomTaxonomy, points, questionText, hint, explanation, body (type-specific data).

Each question should include steps: string[] (optional step-by-step solution).
For multiple-choice body: { options: [{id:"A",text:"...",isCorrect:boolean}], correctOptionId: "A", allowMultiple: false }
For short-answer body: { modelAnswer: "...", acceptableAnswers: ["..."], maxLength: 200 }
For calculation body: { formula: "...", correctValue: number, unit: "...", tolerance: number }

Return ONLY valid JSON array, no markdown.`,
			};
		}

		const prompts: Record<string, PromptTemplate> = {
			"multiple-choice": {
				system: `You are an expert MCQ generator for ${subject}. Create clear, unambiguous multiple-choice questions with plausible distractors.`,
				user: `Generate ${count} multiple-choice questions for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id: string (unique like "q1")
- type: "multiple-choice"
- subject, topic, difficulty, bloomTaxonomy, points
- questionText: string (the question, with LaTeX math using $...$)
- options: [{id:"A"|"B"|"C"|"D", text: string, isCorrect: boolean}]
- correctOptionId: the id of the correct option
- allowMultiple: false
- hint: string (a helpful hint)
- explanation: string (why the answer is correct)
- steps: string[] (optional step-by-step solution)

Rules:
- Exactly one correct option unless allowMultiple is true
- Distractors must be plausible
- Options should be similar length
- Avoid "all of the above" and "none of the above"
- Use $...$ for LaTeX math notation
- For sciences, include diagram references in media when applicable

Return ONLY valid JSON array.`,
			},

			matching: {
				system: `You are an expert at creating matching questions for ${subject}. Create clear matching exercises where students connect related items.`,
				user: `Generate ${count} matching question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "matching", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions for matching
- body.pairs: [{left: string, right: string}] — the correct pairings
- body.shuffle: true
- steps: string[] (optional step-by-step explanation of each pairing)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			"short-answer": {
				system: `You are an expert at creating short-answer questions for ${subject}. Create questions that have a concise, specific correct answer.`,
				user: `Generate ${count} short-answer questions for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "short-answer", subject, topic, difficulty, bloomTaxonomy, points
- questionText: the question
- body.modelAnswer: the correct answer
- body.acceptableAnswers: array of acceptable alternative wordings
- body.maxLength: max character count (100-300)
- steps: string[] (optional step-by-step explanation)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			"long-answer": {
				system: `You are an expert at creating long-answer questions for ${subject}. Create questions requiring detailed paragraph responses.`,
				user: `Generate ${count} long-answer question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "long-answer", subject, topic, difficulty, bloomTaxonomy, points
- questionText: the question
- body.rubric: [{name, description, maxScore}]
- body.modelAnswer: full model answer
- body.minWords, body.maxWords
- steps: string[] (optional step-by-step outline of expected response)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			essay: {
				system: `You are an expert at creating essay questions for ${subject}. Create thought-provoking essay prompts with clear rubrics.`,
				user: `Generate ${count} essay question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "essay", subject, topic, difficulty, bloomTaxonomy, points
- questionText: the essay prompt
- body.rubric: [{name, description, maxScore}] — 3-5 criteria
- body.modelAnswer: outline of expected response
- body.wordLimit: maximum words
- steps: string[] (optional outline of how to structure the response)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			calculation: {
				system: `You are an expert at creating calculation questions for ${subject}. Create numerical problems with clear formulas and units. Use $...$ for LaTeX math notation.`,
				user: `Generate ${count} calculation question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "calculation", subject, topic, difficulty, bloomTaxonomy, points
- questionText: the problem (use $...$ for formulas)
- body.formula: the formula in LaTeX
- body.correctValue: the numerical answer
- body.unit: the unit of measurement
- body.tolerance: acceptable margin of error (e.g., 0.1)
- steps: [step-by-step solution array]
- hint, explanation

Return ONLY valid JSON array.`,
			},

			diagram: {
				system: `You are an expert at creating diagram-based questions for ${subject}. Create questions that involve labeling, completing, or interpreting diagrams.`,
				user: `Generate ${count} diagram question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "diagram", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions about the diagram
- body.diagramData: { type: "force-vector"|"circuit"|"wave"|"motion"|"node-flow"|"node"|"custom-svg", title, data: {...} }
- body.instructions: what the student should do with the diagram
- steps: string[] (optional step-by-step identification guide)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			"source-based": {
				system: `You are an expert at creating source-based questions for ${subject}. Create multi-part questions based on provided sources (text, images, data).`,
				user: `Generate ${count} source-based question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "source-based", subject, topic, difficulty, bloomTaxonomy, points
- questionText: overall context
- body.source: { type: "text"|"image"|"table"|"graph"|"map"|"infographic", content: string, attribution?, mediaUrl? }
- body.subQuestions: [{id, questionText, type, points, body}]
- hint, explanation

Return ONLY valid JSON array.`,
			},

			programming: {
				system: `You are an expert at creating programming questions. Create coding problems with clear specifications and test cases.`,
				user: `Generate ${count} programming question(s). Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "programming", subject, topic, difficulty, bloomTaxonomy, points
- questionText: the programming problem description
- body.language: the programming language
- body.starterCode: optional starter code
- body.testCases: [{input, expectedOutput, description}]
- body.timeLimit: time limit in ms
- steps: string[] (optional step-by-step solution approach)
- hint, explanation

Return ONLY valid JSON array.`,
			},

			"data-response": {
				system: `You are an expert at creating data response questions for ${subject}. Create questions that require interpreting tables, charts, and graphs.`,
				user: `Generate ${count} data response question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "data-response", subject, topic, difficulty, bloomTaxonomy, points
- questionText: context
- body.data: { type: "table"|"chart"|"graph", title, headers?, rows?, chartType?, chartData? }
- body.questions: [{id, questionText, type, points, body}]
- hint, explanation

Return ONLY valid JSON array.`,
			},

			mixed: {
				system: `You are an expert at creating mixed-type questions for ${subject}. Create compound questions that combine multiple question types (e.g., a source with MCQs and a short answer).`,
				user: `Generate ${count} mixed question(s) for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}

Each question must have:
- id, type: "mixed", subject, topic, difficulty, bloomTaxonomy, points
- questionText: overall context
- body.parts: [{id, questionText, type, points, body}]
- hint, explanation

Return ONLY valid JSON array.`,
			},
		};

		return prompts[type] ?? prompts["multiple-choice"];
	}

	getHintPrompt(questionType: QuestionType): PromptTemplate {
		return {
			system: `You are a helpful tutor. Generate a single, concise hint that guides the student toward the answer without giving it away.`,
			user: `Generate a hint for this ${questionType} question. The hint should help the student think in the right direction but not reveal the answer directly. Return ONLY the hint text, no JSON.`,
		};
	}

	getGradePrompt(type: QuestionType): PromptTemplate {
		const gradePrompts: Record<string, PromptTemplate> = {
			"short-answer": {
				system: `You are a fair grader. Evaluate if the student's answer is semantically equivalent to the model answer. Accept synonyms, minor typos, and rephrasing.`,
				user: `Evaluate the student's short answer against the model answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
			},
			"long-answer": {
				system: `You are a fair grader. Evaluate the student's answer against the rubric criteria. Score each criterion independently.`,
				user: `Evaluate the student's long answer against the rubric. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
			},
			essay: {
				system: `You are a fair essay grader. Evaluate structure, argument quality, evidence use, and clarity against the rubric.`,
				user: `Evaluate the essay against the rubric. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
			},
			calculation: {
				system: `You are a precise math/science grader. Check if the student's numeric answer is correct within the given tolerance and has the correct unit.`,
				user: `Evaluate the calculation answer. Consider: correct value within tolerance, correct unit. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
			},
			diagram: {
				system: `You evaluate diagram-based answers. Check if the student correctly identified/labeled the required elements.`,
				user: `Evaluate the diagram answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
			},
			programming: {
				system: `You are a code reviewer and grader. Evaluate code correctness, style, and efficiency. Consider if it passes the test cases.`,
				user: `Evaluate the programming solution against test cases and code quality. Return JSON: { correct: boolean, score: number (0-100), feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
			},
			"source-based": {
				system: `You evaluate source-based responses. Check if the student correctly interpreted the source material and answered accurately.`,
				user: `Evaluate the source-based answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
			},
			"data-response": {
				system: `You evaluate data response answers. Check if the student correctly interpreted the data and drew valid conclusions.`,
				user: `Evaluate the data response answer. Return JSON: { correct: boolean, score: number (0-100), feedback: string }`,
			},
			mixed: {
				system: `You evaluate mixed-type answers. Grade each part independently and aggregate the results.`,
				user: `Evaluate the mixed answer. Return JSON: { correct: boolean, score: number, maxScore: number, feedback: string, breakdown: [{criterion, score, maxScore, feedback}] }`,
			},
		};
		return gradePrompts[type] ?? gradePrompts["short-answer"];
	}
}
