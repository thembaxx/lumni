import type { QAFile } from "@/lib/types/questions";

export const QUESTION_FILES: Record<string, string[]> = {
	Mathematics: ["mathematics_qa_1.json", "mathematics_qa_2.json"],
	"Physical Science": [
		"physical_science_qa_1.json",
		"physical_science_qa_2.json",
	],
	"Life Sciences": ["life_sciences_qa_1.json", "life_sciences_qa_2.json"],
	Geography: ["geography_qa_1.json", "geography_qa_2.json"],
	History: ["history_qa_1.json", "history_qa_2.json"],
	"English Home Language": [
		"english_home_language_qa_1.json",
		"english_home_language_qa_2.json",
	],
	"Afrikaans Home Language": [
		"afrikaans_home_language_qa_1.json",
		"afrikaans_home_language_qa_2.json",
	],
	"Sepedi Home Language": [
		"sepedi_home_language_qa_1.json",
		"sepedi_home_language_qa_2.json",
	],
	"Business Studies": [
		"business_studies_qa_1.json",
		"business_studies_qa_2.json",
	],
	"Information Technology": [
		"information_technology_qa_1.json",
		"information_technology_qa_2.json",
	],
};

export const QUESTIONS_BASE_PATH = "/lib/data/questions";

export function getSubjectQuestionFiles(subject: string): string[] {
	return QUESTION_FILES[subject] || [];
}

export async function loadSubjectQuestions(
	subject: string,
): Promise<QAFile | null> {
	const files = getSubjectQuestionFiles(subject);
	if (files.length === 0) return null;

	// Load and combine all files for the subject
	let allQuestions: QAFile["questions"] = [];
	let metadata: QAFile["metadata"] | null = null;

	for (const file of files) {
		try {
			const response = await import(`@/lib/data/questions/${file}`);
			const data = response.default as QAFile;
			allQuestions = [...allQuestions, ...data.questions];
			if (!metadata) {
				metadata = data.metadata;
			}
		} catch (error) {
			// File may not exist yet - skip
			console.warn(`Could not load ${file}:`, error);
		}
	}

	if (!metadata || allQuestions.length === 0) return null;

	return {
		metadata: {
			...metadata,
			totalQuestions: allQuestions.length,
		},
		questions: allQuestions,
	};
}
