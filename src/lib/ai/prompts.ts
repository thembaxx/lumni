export const prompts = {
	"lesson-summary": {
		system: `You are an expert teacher. Generate concise, clear summaries of lesson topics for students.`,
		user: ({
			topic,
			subject,
			difficulty,
		}: {
			topic: string;
			subject: string;
			difficulty: string;
		}) =>
			`Create a brief summary for a ${difficulty} level ${subject} lesson on: ${topic}. Keep it under 200 words.`,
	},

	"question-generation": {
		system: `You are an expert at generating exam questions. Create clear, well-structured questions with accurate answers. For subjects like physics, chemistry, biology, geography, and engineering, include references to relevant diagrams, charts, or images where they would enhance understanding.`,
		user: ({
			topic,
			subject,
			count,
			difficulty,
		}: {
			topic: string;
			subject: string;
			count: number;
			difficulty: string;
		}) =>
			`Generate ${count} multiple choice questions for ${subject} on: ${topic}. Difficulty: ${difficulty}. 

IMPORTANT: Distribute questions evenly across all subjects in the prompt - if multiple subjects are covered, ensure equal number of questions per subject (e.g., if covering physics, chemistry, and biology with 9 questions, generate 3 questions per subject).

For each question, include: question, options (A-D), correctAnswer, explanation, and where applicable include a visualReference describing a diagram, chart, or image that would complement the question (e.g., "Force diagram showing vector arrows", "Periodic table section", "Heart anatomy diagram"). If no visual is suitable, set visualReference to null.

Format as JSON array with fields: question, options, correctAnswer, explanation, visualReference.`,
	},

	"concept-explanation": {
		system: `You are a patient teacher explains concepts clearly with examples. Use simple language.`,
		user: ({
			concept,
			context,
			level,
		}: {
			concept: string;
			context: string;
			level: string;
		}) =>
			`Explain "${concept}" in the context of ${context} for ${level} students. Include an example.`,
	},

	"content-creation": {
		system: `You are an educational content creator. Create engaging, accurate content.`,
		user: ({
			topic,
			type,
			subject,
		}: {
			topic: string;
			type: string;
			subject: string;
		}) =>
			`Create ${type} content for ${subject} on: ${topic}. Make it engaging and accurate.`,
	},

	"quiz-generation": {
		system: `You generate quizzes for educational platforms. Create varied, clear questions. For subjects like physics, chemistry, biology, geography, and engineering, include references to relevant diagrams, charts, or images where they would enhance understanding.`,
		user: ({
			topic,
			subject,
			questionCount,
			difficulty,
		}: {
			topic: string;
			subject: string;
			questionCount: number;
			difficulty: string;
		}) =>
			`Generate a ${difficulty} quiz with ${questionCount} questions for ${subject}: ${topic}. Include multiple choice, true/false, and short answer. 

IMPORTANT: Distribute questions evenly across all subjects - if multiple subjects are covered, ensure equal number of questions per subject.

For each question, include a visualReference describing any relevant diagram, chart, or image where applicable (e.g., "Circuit diagram", "Molecule structure", "Map of tectonic plates"). If no visual is suitable, set visualReference to null.

Return as JSON with fields: question, type, options, correctAnswer, explanation, visualReference.`,
	},
} as const;

export type PromptKey = keyof typeof prompts;

export function getPrompt(key: PromptKey, params: Record<string, unknown>) {
	const template = prompts[key];
	if (!template) throw new Error(`Unknown prompt: ${key}`);
	return {
		system: template.system,
		user: template.user(params as never),
	};
}
