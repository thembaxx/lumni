import type { PromptTemplate } from "../prompt-manager";
import type { GenerationParams } from "../types";

function buildBaseUser(
	type: string,
	params: GenerationParams,
	difficulty: string,
	bloomStr: string,
	unit: string,
	studentCtx: string,
	examExamples: string,
): string {
	const subject = params.subject;
	const topic = params.topic ? ` on the topic: ${params.topic}` : "";
	return `Generate ${params.count} ${type} questions for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}${examExamples}`;
}

export function buildGeneratePrompt(
	type: string,
	params: GenerationParams,
	studentCtx: string,
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

	const examExamples =
		params.pastPaperExamples && params.pastPaperExamples.length > 0
			? `\n\nHere are real past exam questions on this topic. Use them as style and difficulty references — generate NEW questions at a similar level, NOT duplicates:\n${params.pastPaperExamples.map((ex, i) => `--- Past Paper Example ${i + 1} (${ex.year}, ${ex.marks} marks) ---\nQ: ${ex.questionText}\nA: ${ex.answerText}`).join("\n\n")}${params.pastPaperMode ? "\nIMPORTANT: Match the style, tone, and format of NSC exam papers closely. Use exam-appropriate phrasing and mark allocation." : ""}`
			: "";

	if (type === "any") {
		return {
			system: `You are an expert educational question generator for ${subject}. Generate a diverse mix of question types appropriate for the subject. Choose the most suitable type for each question based on what is being tested.`,
			user: `Generate ${count} questions for ${subject}${topic}. Difficulty: ${difficulty}${bloomStr}${unit}${studentCtx}${examExamples}

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
			user: `${buildBaseUser("multiple-choice", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("matching", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("short-answer", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("long-answer", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("essay", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("calculation", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("diagram", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("source-based", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("programming", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("data-response", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

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
			user: `${buildBaseUser("mixed", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

Each question must have:
- id, type: "mixed", subject, topic, difficulty, bloomTaxonomy, points
- questionText: overall context
- body.parts: [{id, questionText, type, points, body}]
- hint, explanation

Return ONLY valid JSON array.`,
		},

		ordering: {
			system: `You are an expert at creating ordering questions for ${subject}. Create questions where students arrange items (steps, events, processes, or values) in the correct sequence by dragging them into order.`,
			user: `${buildBaseUser("ordering", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

Each question must have:
- id, type: "ordering", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions for ordering (e.g., "Arrange these steps in the correct order")
- body.items: [{id: string, text: string}] — the items to be ordered (in correct order, engine will shuffle)
- body.correctOrder: [string] — array of item IDs in the correct sequence
- body.shuffle: true
- steps: string[] (optional step-by-step explanation of the correct order)
- hint, explanation

Good for: steps in a proof, chronological events, process stages, sorting by magnitude/priority.
Items should be distinct and unambiguous.
Use $...$ for LaTeX math notation.
Points should be 2-5 depending on the number of items.

Return ONLY valid JSON array.`,
		},

		"diagram-labelling": {
			system: `You are an expert at creating diagram-labelling questions for ${subject}. Create questions where students drag text labels onto the correct regions of a diagram.`,
			user: `${buildBaseUser("diagram-labelling", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

Each question must have:
- id, type: "diagram-labelling", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions for labelling the diagram
- body.width, body.height: dimensions of the diagram area (e.g. 400, 300)
- body.regions: [{id: string, label: string, x: number, y: number, width: number, height: number}] — the clickable regions on the diagram
- body.labels: [{id: string, text: string}] — the draggable labels (will be shuffled for display)
- body.correctPlacements: [{labelId: string, regionId: string}] — which label goes where
- body.svgContent: string (optional inline SVG for the diagram)
- body.imageUrl: string (optional URL to an image)
- steps: string[] (optional step-by-step identification guide)
- hint, explanation

Good for: labelling diagrams of cells, apparatus, graphs, maps, anatomical structures.
Use $...$ for LaTeX math notation.
Points should be 2-5 depending on the number of labels.

Return ONLY valid JSON array.`,
		},

		"fill-in-sequence": {
			system: `You are an expert at creating fill-in-sequence questions for ${subject}. Create questions where students drag items into blank slots to complete a sequence, formula, or text passage.`,
			user: `${buildBaseUser("fill-in-sequence", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

Each question must have:
- id, type: "fill-in-sequence", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions (e.g., "Complete the sequence by filling in the blanks")
- body.sequence: [{text: string, blankId?: string}] — the sequence of text segments with optional blank slots
- body.blanks: [{id: string, correctAnswer: string, distractors?: string[]}] — the blank definitions with correct answers and optional distractors
- body.shuffleDistractors: true
- steps: string[] (optional step-by-step explanation)
- hint, explanation

Good for: completing chemical equations, filling in math formula terms, completing sentences, filling in diagram labels.
Use $...$ for LaTeX math notation.
Points should be 2-5 depending on the number of blanks.

Return ONLY valid JSON array.`,
		},

		"match-pairs": {
			system: `You are an expert at creating match-pairs questions for ${subject}. Create questions where students drag items from a left column to connect with correct matches on the right.`,
			user: `${buildBaseUser("match-pairs", params, difficulty, bloomStr, unit, studentCtx, examExamples)}

Each question must have:
- id, type: "match-pairs", subject, topic, difficulty, bloomTaxonomy, points
- questionText: instructions (e.g., "Match each term with its definition")
- body.leftItems: [{id: string, text: string}] — the items to be matched (terms, concepts, questions)
- body.rightItems: [{id: string, text: string}] — the target matches (definitions, answers, descriptions)
- body.correctMatches: [{leftId: string, rightId: string}] — the correct pairings
- body.shuffle: true
- steps: string[] (optional step-by-step explanation of each pairing)
- hint, explanation

Good for: term-definition matching, cause-effect matching, concept-example matching, formula-name matching.
Each left item must have exactly one correct right match.
Use $...$ for LaTeX math notation.
Points should be 2-5 depending on the number of pairs.

Return ONLY valid JSON array.`,
		},
	};

	return prompts[type] ?? prompts["multiple-choice"];
}
