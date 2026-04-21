import { eq } from "drizzle-orm";
import { db } from "./db";
import {
	question,
	studySession,
	subject,
	topic,
	userProgress,
	userSubject,
} from "./db/schema";

const nscSubjects = [
	{
		id: "mathematics",
		name: "Mathematics",
		code: "4050",
		description:
			"CAPS Mathematics Grade 12 - Calculus, Algebra, trigonometry, and geometry",
		icon: "calculator",
		category: "sciences",
		color: "#3b82f6",
	},
	{
		id: "physical-sciences",
		name: "Physical Sciences",
		code: "4054",
		description: "CAPS Physical Sciences Grade 12 - Physics and Chemistry",
		icon: "atom",
		category: "sciences",
		color: "#10b981",
	},
	{
		id: "life-sciences",
		name: "Life Sciences",
		code: "4053",
		description:
			"CAPS Life Sciences Grade 12 - Biology, genetics, and evolution",
		icon: "dna",
		category: "sciences",
		color: "#8b5cf6",
	},
	{
		id: "accounting",
		name: "Accounting",
		code: "4041",
		description:
			"CAPS Accounting Grade 12 - Financial statements and management",
		icon: "receipt",
		category: "commerce",
		color: "#f59e0b",
	},
	{
		id: "business-studies",
		name: "Business Studies",
		code: "4043",
		description:
			"CAPS Business Studies Grade 12 - Business principles and practices",
		icon: "briefcase",
		category: "commerce",
		color: "#ec4899",
	},
	{
		id: "economics",
		name: "Economics",
		code: "4044",
		description: "CAPS Economics Grade 12 - Micro and macro economics",
		icon: "trending-up",
		category: "commerce",
		color: "#06b6d4",
	},
	{
		id: "geography",
		name: "Geography",
		code: "4046",
		description: "CAPS Geography Grade 12 - Physical and human geography",
		icon: "globe",
		category: "humanities",
		color: "#14b8a6",
	},
	{
		id: "history",
		name: "History",
		code: "4047",
		description: "CAPS History Grade 12 - South African and world history",
		icon: "book-open",
		category: "humanities",
		color: "#dc2626",
	},
];

const physicsTopics = [
	{
		id: "ps-mechanics",
		subjectId: "physical-sciences",
		name: "Mechanics",
		description: "Momentum, Newton's Laws, Work, Energy and Power",
		unitNumber: 1,
		orderIndex: 1,
	},
	{
		id: "ps-waves",
		subjectId: "physical-sciences",
		name: "Waves and Sound",
		description: "Wave properties, Doppler effect, Sound waves",
		unitNumber: 2,
		orderIndex: 2,
	},
	{
		id: "ps-electricity",
		subjectId: "physical-sciences",
		name: "Electricity and Magnetism",
		description: "Electric circuits, Electrostatics, Electrodynamics",
		unitNumber: 3,
		orderIndex: 3,
	},
	{
		id: "ps-matter",
		subjectId: "physical-sciences",
		name: "Matter and Materials",
		description: "Organic chemistry, Rates of reaction, Chemical equilibrium",
		unitNumber: 4,
		orderIndex: 4,
	},
];

const mathTopics = [
	{
		id: "math-calculus",
		subjectId: "mathematics",
		name: "Calculus",
		description: "Differential calculus, Integration, Applications",
		unitNumber: 1,
		orderIndex: 1,
	},
	{
		id: "math-algebra",
		subjectId: "mathematics",
		name: "Algebra",
		description: "Number patterns, Sequences and series, Finance",
		unitNumber: 2,
		orderIndex: 2,
	},
	{
		id: "math-trig",
		subjectId: "mathematics",
		name: "Trigonometry",
		description: "Trigonometric identities, Equations, Graphs",
		unitNumber: 3,
		orderIndex: 3,
	},
];

const lifeScienceTopics = [
	{
		id: "ls-genetics",
		subjectId: "life-sciences",
		name: "Genetics",
		description: "DNA, inheritance, genetic engineering",
		unitNumber: 1,
		orderIndex: 1,
	},
	{
		id: "ls-evolution",
		subjectId: "life-sciences",
		name: "Evolution",
		description: "Natural selection, speciation, human evolution",
		unitNumber: 2,
		orderIndex: 2,
	},
];

interface QuestionData {
	id: string;
	topicId: string;
	type: string;
	questionText: string;
	options: string;
	correctAnswer: string;
	explanation: string;
	difficulty: string;
	hasImage: boolean;
}

const physicsQuestions: QuestionData[] = [
	{
		id: "ps-q1",
		topicId: "ps-mechanics",
		type: "multiple_choice",
		questionText:
			"A 2 kg ball is thrown vertically upwards with a velocity of 15 m/s. What is the maximum height reached? (g = 10 m/s²)",
		options: JSON.stringify({
			A: "11.25 m",
			B: "22.5 m",
			C: "5.625 m",
			D: "45 m",
		}),
		correctAnswer: "A",
		explanation:
			"Using v² = u² + 2as: 0 = 15² + 2(-10)s, so s = 225/20 = 11.25 m",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "ps-q2",
		topicId: "ps-mechanics",
		type: "multiple_choice",
		questionText:
			"A trolley of mass 2 kg moving at 3 m/s collides with a stationary trolley of mass 1 kg. If the collision is elastic, what is the velocity of the 1 kg trolley after collision?",
		options: JSON.stringify({
			A: "4 m/s",
			B: "2 m/s",
			C: "6 m/s",
			D: "1 m/s",
		}),
		correctAnswer: "A",
		explanation:
			"Using conservation of momentum: 2(3) + 1(0) = 2v₁ + 1v₂. For elastic: v₁ = 1 m/s, v₂ = 4 m/s",
		difficulty: "hard",
		hasImage: false,
	},
	{
		id: "ps-q3",
		topicId: "ps-mechanics",
		type: "multiple_choice",
		questionText: "Newton's Second Law can be written as:",
		options: JSON.stringify({
			A: "F = ma",
			B: "F = mv",
			C: "F = m/a",
			D: "F = m + a",
		}),
		correctAnswer: "A",
		explanation:
			"Newton's Second Law states that Force equals mass times acceleration (F = ma)",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ps-q4",
		topicId: "ps-mechanics",
		type: "multiple_choice",
		questionText:
			"A 5 kg object is lifted vertically at constant velocity. What is the minimum force required? (g = 10 m/s²)",
		options: JSON.stringify({
			A: "50 N",
			B: "5 N",
			C: "100 N",
			D: "0 N",
		}),
		correctAnswer: "A",
		explanation:
			"At constant velocity, net force = 0. The lifting force must equal the weight: F = mg = 5 × 10 = 50 N",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ps-q5",
		topicId: "ps-mechanics",
		type: "multiple_choice",
		questionText:
			"The work done in moving a box across a frictionless surface is equal to:",
		options: JSON.stringify({
			A: "Force × Distance",
			B: "Force / Distance",
			C: "Mass × Distance",
			D: "Mass × Gravity",
		}),
		correctAnswer: "A",
		explanation: "Work = Force × displacement in the direction of the force",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ps-q6",
		topicId: "ps-waves",
		type: "multiple_choice",
		questionText: "The frequency of a wave is 50 Hz. What is the period?",
		options: JSON.stringify({
			A: "0.02 s",
			B: "0.05 s",
			C: "0.5 s",
			D: "50 s",
		}),
		correctAnswer: "A",
		explanation: "Period T = 1/f = 1/50 = 0.02 s",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ps-q7",
		topicId: "ps-waves",
		type: "multiple_choice",
		questionText:
			"A car moving at 30 m/s emits a sound at 1000 Hz. What frequency does a stationary observer hear as the car approaches? (speed of sound = 340 m/s)",
		options: JSON.stringify({
			A: "1125 Hz",
			B: "875 Hz",
			C: "1000 Hz",
			D: "910 Hz",
		}),
		correctAnswer: "A",
		explanation:
			"Using Doppler effect: f' = f(v/(v - vs)) = 1000(340/(340-30)) ≈ 1000(1.096) ≈ 1096 Hz ≈ 1125 Hz",
		difficulty: "hard",
		hasImage: false,
	},
	{
		id: "ps-q8",
		topicId: "ps-electricity",
		type: "multiple_choice",
		questionText: "Ohm's Law states that:",
		options: JSON.stringify({
			A: "V = IR",
			B: "V = I/R",
			C: "V = IR²",
			D: "V = I²R",
		}),
		correctAnswer: "A",
		explanation:
			"Ohm's Law: Voltage equals Current multiplied by Resistance (V = IR)",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ps-q9",
		topicId: "ps-electricity",
		type: "multiple_choice",
		questionText:
			"Two resistors of 2Ω and 3Ω are connected in parallel. What is the effective resistance?",
		options: JSON.stringify({
			A: "1.2 Ω",
			B: "5 Ω",
			C: "1 Ω",
			D: "6 Ω",
		}),
		correctAnswer: "A",
		explanation: "For parallel: 1/R = 1/2 + 1/3 = 5/6, so R = 6/5 = 1.2 Ω",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "ps-q10",
		topicId: "ps-electricity",
		type: "multiple_choice",
		questionText: "Electrical power is calculated using:",
		options: JSON.stringify({
			A: "P = IV",
			B: "P = I/V",
			C: "P = V/I",
			D: "P = I + V",
		}),
		correctAnswer: "A",
		explanation: "Power P = IV = I²R = V²/R",
		difficulty: "easy",
		hasImage: false,
	},
];

const mathQuestions: QuestionData[] = [
	{
		id: "math-q1",
		topicId: "math-calculus",
		type: "multiple_choice",
		questionText: "Find the derivative of f(x) = x³ + 2x",
		options: JSON.stringify({
			A: "3x² + 2",
			B: "3x²",
			C: "x³ + 2",
			D: "6x²",
		}),
		correctAnswer: "A",
		explanation: "d/dx(x³) = 3x², d/dx(2x) = 2. So f'(x) = 3x² + 2",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q2",
		topicId: "math-calculus",
		type: "multiple_choice",
		questionText: "Find ∫2x dx",
		options: JSON.stringify({
			A: "x² + C",
			B: "2x² + C",
			C: "x + C",
			D: "2 + C",
		}),
		correctAnswer: "A",
		explanation: "∫2x dx = 2(x²/2) + C = x² + C",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q3",
		topicId: "math-calculus",
		type: "multiple_choice",
		questionText: "If y = x², find dy/dx when x = 3",
		options: JSON.stringify({
			A: "6",
			B: "9",
			C: "3",
			D: "0",
		}),
		correctAnswer: "A",
		explanation: "dy/dx = 2x. At x = 3: dy/dx = 2(3) = 6",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q4",
		topicId: "math-calculus",
		type: "multiple_choice",
		questionText: "The stationary point of f(x) = x² - 4x + 3 is at:",
		options: JSON.stringify({
			A: "x = 2",
			B: "x = 4",
			C: "x = -2",
			D: "x = 0",
		}),
		correctAnswer: "A",
		explanation:
			"f'(x) = 2x - 4 = 0, so x = 2. This is a minimum (f''(2) = 2 > 0)",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "math-q5",
		topicId: "math-algebra",
		type: "multiple_choice",
		questionText: "Find the 10th term of the sequence: 2, 5, 8, 11, ...",
		options: JSON.stringify({
			A: "29",
			B: "32",
			C: "27",
			D: "30",
		}),
		correctAnswer: "A",
		explanation:
			"This is an arithmetic sequence with d = 3. T₁₀ = 2 + 9(3) = 2 + 27 = 29",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q6",
		topicId: "math-algebra",
		type: "multiple_choice",
		questionText: "The sum of the first 5 terms of 2 + 4 + 6 + ... is:",
		options: JSON.stringify({
			A: "30",
			B: "20",
			C: "15",
			D: "40",
		}),
		correctAnswer: "A",
		explanation:
			"This is an arithmetic series. S₅ = n/2(a₁ + a₅) = 5/2(2 + 10) = 5/2 × 12 = 30",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "math-q7",
		topicId: "math-trig",
		type: "multiple_choice",
		questionText: "sin(90°) = ?",
		options: JSON.stringify({
			A: "1",
			B: "0",
			C: "-1",
			D: "0.5",
		}),
		correctAnswer: "A",
		explanation: "sin(90°) = 1",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q8",
		topicId: "math-trig",
		type: "multiple_choice",
		questionText: "cos²θ + sin²θ = ?",
		options: JSON.stringify({
			A: "1",
			B: "0",
			C: "2",
			D: "-1",
		}),
		correctAnswer: "A",
		explanation: "Pythagorean identity: cos²θ + sin²θ = 1",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "math-q9",
		topicId: "math-calculus",
		type: "multiple_choice",
		questionText: "Find the area under y = x from x = 0 to x = 2",
		options: JSON.stringify({
			A: "2 square units",
			B: "4 square units",
			C: "1 square units",
			D: "8 square units",
		}),
		correctAnswer: "A",
		explanation: "∫₀² x dx = [x²/2]₀² = 4/2 - 0 = 2",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "math-q10",
		topicId: "math-algebra",
		type: "multiple_choice",
		questionText: "Factorise: x² - 9",
		options: JSON.stringify({
			A: "(x+3)(x-3)",
			B: "(x+9)(x-1)",
			C: "(x-3)²",
			D: "(x+3)²",
		}),
		correctAnswer: "A",
		explanation: "x² - 9 is a difference of squares: (x+3)(x-3)",
		difficulty: "easy",
		hasImage: false,
	},
];

const lifeScienceQuestions: QuestionData[] = [
	{
		id: "ls-q1",
		topicId: "ls-genetics",
		type: "multiple_choice",
		questionText: "DNA stands for:",
		options: JSON.stringify({
			A: "Deoxyribonucleic acid",
			B: "Dinitrogen oxide",
			C: "Diaribo nucleic acid",
			D: "Dinucleic acid",
		}),
		correctAnswer: "A",
		explanation: "DNA is Deoxyribonucleic acid",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ls-q2",
		topicId: "ls-genetics",
		type: "multiple_choice",
		questionText: "The base pairs in DNA are:",
		options: JSON.stringify({
			A: "A-T, G-C",
			B: "A-G, T-C",
			C: "A-C, T-G",
			D: "A-U, G-C",
		}),
		correctAnswer: "A",
		explanation: "Adenine pairs with Thymine, Guanine pairs with Cytosine",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ls-q3",
		topicId: "ls-genetics",
		type: "multiple_choice",
		questionText: "A gene is:",
		options: JSON.stringify({
			A: "A segment of DNA that codes for a protein",
			B: "A type of cell",
			C: "A chromosome",
			D: "An enzyme",
		}),
		correctAnswer: "A",
		explanation:
			"A gene is a functional segment of DNA that codes for a specific protein",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ls-q4",
		topicId: "ls-evolution",
		type: "multiple_choice",
		questionText: "Charles Darwin proposed the theory of:",
		options: JSON.stringify({
			A: "Natural selection",
			B: "Creationism",
			C: "Spontaneous generation",
			D: "Pangenesis",
		}),
		correctAnswer: "A",
		explanation: "Darwin proposed evolution by natural selection",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ls-q5",
		topicId: "ls-evolution",
		type: "multiple_choice",
		questionText:
			"The oldest hominin ancestor commonly mentioned in human evolution is:",
		options: JSON.stringify({
			A: "Australopithecus",
			B: "Homo sapiens",
			C: "Gorilla",
			D: "Chimpanzee",
		}),
		correctAnswer: "A",
		explanation: "Australopithecus is the oldest hominin in the human lineage",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "ls-q6",
		topicId: "ls-genetics",
		type: "multiple_choice",
		questionText: "Mitosis results in:",
		options: JSON.stringify({
			A: "Two identical daughter cells",
			B: "Four different daughter cells",
			C: "One daughter cell",
			D: "Three daughter cells",
		}),
		correctAnswer: "A",
		explanation: "Mitosis produces two identical diploid daughter cells",
		difficulty: "easy",
		hasImage: false,
	},
	{
		id: "ls-q7",
		topicId: "ls-genetics",
		type: "multiple_choice",
		questionText: "Meiosis results in:",
		options: JSON.stringify({
			A: "Four haploid daughter cells",
			B: "Two diploid daughter cells",
			C: "Three daughter cells",
			D: "One daughter cell",
		}),
		correctAnswer: "A",
		explanation: "Meiosis produces four genetically different haploid gametes",
		difficulty: "medium",
		hasImage: false,
	},
	{
		id: "ls-q8",
		topicId: "ls-evolution",
		type: "multiple_choice",
		questionText: "Alleles are:",
		options: JSON.stringify({
			A: "Different versions of the same gene",
			B: "The same gene",
			C: "Different genes",
			D: "Chromosomes",
		}),
		correctAnswer: "A",
		explanation: "Alleles are alternative forms of a gene at the same locus",
		difficulty: "easy",
		hasImage: false,
	},
];

export async function seedDatabase() {
	console.log("🌱 Seeding database...");

	for (const subj of nscSubjects) {
		await db.insert(subject).values(subj).onConflictDoNothing();
	}
	console.log("✓ Subjects seeded");

	const allTopics = [...physicsTopics, ...mathTopics, ...lifeScienceTopics];
	for (const t of allTopics) {
		await db.insert(topic).values(t).onConflictDoNothing();
	}
	console.log("✓ Topics seeded");

	const allQuestions = [
		...physicsQuestions,
		...mathQuestions,
		...lifeScienceQuestions,
	];
	for (const q of allQuestions) {
		await db.insert(question).values(q).onConflictDoNothing();
	}
	console.log("✓ Questions seeded");

	console.log("✅ Database seeded successfully!");
	console.log(`   - ${nscSubjects.length} subjects`);
	console.log(`   - ${allTopics.length} topics`);
	console.log(`   - ${allQuestions.length} questions`);
}

export async function getUserStats(userId: string) {
	const progressArr = await db
		.select()
		.from(userProgress)
		.where(eq(userProgress.userId, userId))
		.limit(1);

	const progress = progressArr[0] || null;

	const sessions = await db
		.select()
		.from(studySession)
		.where(eq(studySession.userId, userId));

	const totalAnswered = sessions.reduce(
		(sum, s) => sum + (s.questionsAnswered || 0),
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum, s) => sum + (s.correctCount || 0),
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return {
		totalQuestionsAnswered: totalAnswered,
		accuracy,
		currentStreak: progress?.currentStreak ?? 0,
		longestStreak: progress?.longestStreak ?? 0,
	};
}

export async function selectSubject(userId: string, subjectId: string) {
	await db
		.insert(userSubject)
		.values({
			id: `${userId}-${subjectId}`,
			userId,
			subjectId,
		})
		.onConflictDoNothing();

	await db
		.insert(userProgress)
		.values({
			id: `${userId}-${subjectId}`,
			userId,
			subjectId,
			questionsAttempted: 0,
			correctCount: 0,
			currentStreak: 0,
			longestStreak: 0,
		})
		.onConflictDoNothing();
}
