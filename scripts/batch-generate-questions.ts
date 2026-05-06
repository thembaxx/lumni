import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const questionsDir = path.join(__dirname, "..", "questions");

const subjects = [
	{ id: "mathematics", name: "Mathematics" },
	{ id: "physical-sciences", name: "Physical Sciences" },
	{ id: "life-sciences", name: "Life Sciences" },
	{ id: "geography", name: "Geography" },
	{ id: "history", name: "History" },
	{ id: "accounting", name: "Accounting" },
	{ id: "business-studies", name: "Business Studies" },
	{ id: "economics", name: "Economics" },
	{ id: "english-home-language", name: "English Home Language" },
	{ id: "afrikaans-home-language", name: "Afrikaans Home Language" },
	{ id: "isi-zulu-home-language", name: "IsiZulu Home Language" },
	{ id: "information-technology", name: "Information Technology" },
	{ id: "engineering-graphics-and-design", name: "Engineering Graphics and Design" },
	{ id: "tourism", name: "Tourism" },
	{ id: "consumer-studies", name: "Consumer Studies" },
];

const topicsBySubject: Record<string, string[]> = {
	mathematics: [
		"Algebra",
		"Calculus",
		"Geometry",
		"Statistics",
		"Trigonometry",
		"Probability",
		"Functions",
		"Number Patterns",
	],
	"physical-sciences": [
		"Motion and Newton's Laws",
		"Chemical Reactions",
		"Waves and Sound",
		"Electricity and Magnetism",
		"Matter and Materials",
		"Chemical Bonding",
		"Optics",
		"Thermochemistry",
	],
	"life-sciences": [
		"Cell Biology",
		"Genetics",
		"Evolution",
		"Human Reproduction",
		"Ecosystems",
		"Photosynthesis",
		"Respiration",
		"DNA and RNA",
	],
	geography: [
		"Climate and Weather",
		"Tectonic Plates",
		"Geomorphology",
		"Mapwork",
		"Economic Geography",
		"Population",
		"Urbanization",
		"Water Resources",
	],
	history: [
		"South African History",
		"World War I",
		"World War II",
		"Civil Rights Movement",
		"Cold War",
		"Colonialism",
		"Apartheid",
		"Industrial Revolution",
	],
	accounting: [
		"Financial Statements",
		"Internal Control",
		"Cost Accounting",
		"Budgeting",
		"Asset Valuation",
		"Partnerships",
		"Companies",
		"Value Added Tax",
	],
	"business-studies": [
		"Business Environments",
		"Management",
		"Marketing",
		"Entrepreneurship",
		"Business Ethics",
		"Human Resources",
		"Operations",
		"Strategic Management",
	],
	economics: [
		"Microeconomics",
		"Macroeconomics",
		"Supply and Demand",
		"Inflation",
		"Unemployment",
		"Economic Growth",
		"International Trade",
		"Fiscal Policy",
	],
	"english-home-language": [
		"Literature",
		"Poetry Analysis",
		"Novel Study",
		"Drama",
		"Language Structure",
		"Essay Writing",
		"Comprehension",
		"Visual Literacy",
	],
	"afrikaans-home-language": [
		"Taalstrukture",
		"Literatuur",
		"Opstelle",
		"Leesbegrip",
		"Poësie",
		"Drama",
	],
	"isi-zulu-home-language": [
		"Ulwimi",
		"Incwadi",
		"Amahlulelo",
		"Ukubhala",
		"Ukucwaninga",
	],
	"information-technology": [
		"Programming",
		"Database",
		"Web Development",
		"Networks",
		"System Analysis",
		"Software Development",
		"Data Structures",
		"Algorithms",
	],
	"engineering-graphics-and-design": [
		"Engineering Drawing",
		"Mechanical Drawing",
		"Civil Drawing",
		"Assembly Drawings",
		"Dimensioning",
		"Tolerances",
		"CAD",
		"Projections",
	],
	tourism: [
		"Tourism Sectors",
		"Travel Routes",
		"Customer Service",
		"Tourism Attractions",
		"Travel Documentation",
		"Hospitality",
		"Sustainable Tourism",
		"Tourism Marketing",
	],
	"consumer-studies": [
		"Nutrition",
		"Food Preparation",
		"Consumer Rights",
		"Housing",
		"Textiles",
		"Family Finance",
		"Meal Planning",
	],
};

const difficulties = ["Easy", "Medium", "Hard"];

function getRandomElement<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function generateSubjectId(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function generateFileName(subject: string, number: number = 1): string {
	const formattedSubject = generateSubjectId(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

async function main() {
	if (!fs.existsSync(questionsDir)) {
		fs.mkdirSync(questionsDir, { recursive: true });
	}

	console.log(`Questions directory: ${questionsDir}`);
	console.log(`Total subjects to process: ${subjects.length}`);
	console.log("Starting batch generation...");
	console.log("");
	console.log("NOTE: This script is a template that shows the structure.");
	console.log("To run actual generation, call the API endpoint or use the Next.js app.");
	console.log("");

	for (const subject of subjects) {
		const fileName = generateFileName(subject.name, 1);
		const exists = fs.existsSync(path.join(questionsDir, fileName));
		const status = exists ? "EXISTS" : "MISSING";
		console.log(`[${status}] ${subject.name} -> ${fileName}`);
	}
}

main().catch(console.error);