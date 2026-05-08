import type { QAQuestion } from "@/types/questions";

export interface ExtractedTopic {
	name: string;
	keywords: string[];
	questionCount: number;
	confidence: number;
}

export interface ExamPaperAnalysis {
	fileName: string;
	subject: string;
	year: number;
	totalQuestions: number;
	extractedTopics: ExtractedTopic[];
	rawText: string;
	suggestedDifficulty: "Easy" | "Medium" | "Hard";
}

const TOPIC_KEYWORDS: Record<string, string[]> = {
	Algebra: [
		"equation",
		"variable",
		"solve",
		"factor",
		"simplify",
		"expression",
		"polynomial",
	],
	Calculus: [
		"derivative",
		"integral",
		"limit",
		"differentiation",
		"function",
		"rate",
		"area",
	],
	Geometry: [
		"angle",
		"triangle",
		"circle",
		"theorem",
		"proof",
		"congruent",
		"similar",
	],
	Trigonometry: [
		"sine",
		"cosine",
		"tangent",
		"angle",
		"identity",
		"equation",
		"graph",
	],
	Statistics: [
		"mean",
		"median",
		"mode",
		"probability",
		"distribution",
		"standard deviation",
	],
	Mechanics: [
		"force",
		"velocity",
		"acceleration",
		"motion",
		"Newton",
		"energy",
		"momentum",
	],
	Electricity: [
		"current",
		"voltage",
		"resistance",
		"circuit",
		"power",
		"charge",
	],
	Chemistry: [
		"reaction",
		"equation",
		"mole",
		"concentration",
		"equilibrium",
		"acid",
		"base",
	],
	Biology: [
		"cell",
		"organ",
		"system",
		"photosynthesis",
		"respiration",
		"DNA",
		"evolution",
	],
	Geography: [
		"climate",
		"population",
		"resources",
		"weather",
		"erosion",
		"economic",
	],
	History: [
		"war",
		"revolution",
		"colonial",
		"independence",
		"movement",
		"treaty",
	],
	Accounting: [
		"balance",
		"statement",
		"asset",
		"liability",
		"debit",
		"credit",
		"budget",
	],
	Economics: [
		"demand",
		"supply",
		"market",
		"inflation",
		"GDP",
		"trade",
		"fiscal",
	],
};

export async function extractTextFromPDF(
	file: File,
): Promise<{ text: string; pageCount: number }> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();

		reader.onload = async (e) => {
			try {
				const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);

				const pdfjsLib = await import("pdfjs-dist");
				pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

				const pdf = await pdfjsLib.getDocument(typedarray).promise;
				let fullText = "";

				for (let i = 1; i <= pdf.numPages; i++) {
					const page = await pdf.getPage(i);
					const textContent = await page.getTextContent();
					const pageText = textContent.items
						.map((item: any) => item.str)
						.join(" ");
					fullText += pageText + "\n";
				}

				resolve({ text: cleanText(fullText), pageCount: pdf.numPages });
			} catch (error) {
				reject(error);
			}
		};

		reader.onerror = reject;
		reader.readAsArrayBuffer(file);
	});
}

function cleanText(text: string): string {
	return text
		.replace(/\s+/g, " ")
		.replace(/[^\x20-\x7E\n]/g, "")
		.trim();
}

export function extractTopicsFromText(text: string): ExtractedTopic[] {
	const topics: Map<string, ExtractedTopic> = new Map();

	const lowerText = text.toLowerCase();
	const words = lowerText.split(/\s+/);

	for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
		let matchCount = 0;
		const matchedKeywords: string[] = [];

		keywords.forEach((keyword) => {
			const regex = new RegExp(`\\b${keyword}\\b`, "gi");
			const matches = lowerText.match(regex);
			if (matches) {
				matchCount += matches.length;
				if (!matchedKeywords.includes(keyword)) {
					matchedKeywords.push(keyword);
				}
			}
		});

		if (matchCount > 0) {
			const confidence = Math.min(matchCount / 10, 1);
			topics.set(topic, {
				name: topic,
				keywords: matchedKeywords,
				questionCount: Math.ceil(matchCount / 3),
				confidence,
			});
		}
	}

	const sortedTopics = Array.from(topics.values())
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, 10);

	return sortedTopics;
}

export function detectDifficulty(text: string): "Easy" | "Medium" | "Hard" {
	const lowerText = text.toLowerCase();

	const hardIndicators = [
		"prove",
		"derive",
		"evaluate",
		"analyze",
		"synthesize",
		"critically",
	];
	const easyIndicators = [
		"define",
		"list",
		"name",
		"what is",
		"identify",
		"describe",
	];

	const hardCount = hardIndicators.filter((w) => lowerText.includes(w)).length;
	const easyCount = easyIndicators.filter((w) => lowerText.includes(w)).length;

	if (hardCount > easyCount + 2) return "Hard";
	if (easyCount > hardCount + 2) return "Easy";
	return "Medium";
}

export function extractYearFromFileName(fileName: string): number {
	const yearMatch = fileName.match(/(19|20)\d{2}/);
	if (yearMatch) {
		return parseInt(yearMatch[0]);
	}
	return new Date().getFullYear();
}

export async function analyzeExamPaper(
	file: File,
	subject: string,
): Promise<ExamPaperAnalysis> {
	const { text, pageCount } = await extractTextFromPDF(file);

	const topics = extractTopicsFromText(text);
	const difficulty = detectDifficulty(text);
	const year = extractYearFromFileName(file.name);

	const questionIndicators = text.match(/\d+\.\s/g);
	const totalQuestions = questionIndicators ? questionIndicators.length : 10;

	return {
		fileName: file.name,
		subject,
		year,
		totalQuestions,
		extractedTopics: topics,
		rawText: text.slice(0, 5000),
		suggestedDifficulty: difficulty,
	};
}

export function generateQuizFromAnalysis(
	analysis: ExamPaperAnalysis,
	count: number = 10,
): { topic: string; difficulty: string; count: number }[] {
	const quizPlan: { topic: string; difficulty: string; count: number }[] = [];

	analysis.extractedTopics.slice(0, 5).forEach((topic) => {
		const questionsForTopic = Math.min(
			Math.ceil(count * topic.confidence),
			topic.questionCount,
		);

		quizPlan.push({
			topic: topic.name,
			difficulty: analysis.suggestedDifficulty,
			count: questionsForTopic,
		});
	});

	return quizPlan;
}
