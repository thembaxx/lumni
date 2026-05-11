import type { Option, QAQuestion } from "@/types/questions";

function getMcqOptions(q: QAQuestion): Option[] {
	return (q as unknown as { body: { options: Option[] } }).body?.options ?? [];
}

export interface DuplicateCheckResult {
	duplicates: QAQuestion[];
	newQuestions: QAQuestion[];
	duplicateCount: number;
}

export function checkForDuplicates(
	existingQuestions: QAQuestion[],
	newQuestions: QAQuestion[],
): DuplicateCheckResult {
	const existingHashes = new Set(
		existingQuestions.map((q) => generateQuestionHash(q)),
	);

	const duplicates: QAQuestion[] = [];
	const newQuestionsFiltered: QAQuestion[] = [];

	for (const question of newQuestions) {
		const hash = generateQuestionHash(question);
		if (existingHashes.has(hash)) {
			duplicates.push(question);
		} else {
			newQuestionsFiltered.push(question);
			existingHashes.add(hash);
		}
	}

	return {
		duplicates,
		newQuestions: newQuestionsFiltered,
		duplicateCount: duplicates.length,
	};
}

export function generateQuestionHash(question: QAQuestion): string {
	const normalizedText = question.questionText
		.toLowerCase()
		.replace(/\s+/g, " ")
		.trim();

	const options = getMcqOptions(question);
	const optionsText = options
		.map((opt) => opt.text.toLowerCase().replace(/\s+/g, " ").trim())
		.sort()
		.join("|");

	const correctOption = options.find((opt) => opt.isCorrect);
	return `${normalizedText}|${optionsText}|${correctOption?.id || ""}`;
}

export function findSimilarQuestions(
	questions: QAQuestion[],
	threshold = 0.8,
): Map<string, string[]> {
	const similarMap = new Map<string, string[]>();

	for (let i = 0; i < questions.length; i++) {
		for (let j = i + 1; j < questions.length; j++) {
			const similarity = calculateSimilarity(
				questions[i].questionText,
				questions[j].questionText,
			);

			if (similarity >= threshold) {
				const key = questions[i].id || `q-${i}`;
				const existing = similarMap.get(key) || [];
				existing.push(questions[j].id || `q-${j}`);
				similarMap.set(key, existing);
			}
		}
	}

	return similarMap;
}

function calculateSimilarity(str1: string, str2: string): number {
	const normalized1 = str1.toLowerCase().replace(/\s+/g, "");
	const normalized2 = str2.toLowerCase().replace(/\s+/g, "");

	if (normalized1 === normalized2) return 1;
	if (normalized1.length === 0 || normalized2.length === 0) return 0;

	const maxLength = Math.max(normalized1.length, normalized2.length);
	let matches = 0;

	for (let i = 0; i < normalized1.length; i++) {
		if (normalized2.includes(normalized1[i])) {
			matches++;
		}
	}

	return matches / maxLength;
}
