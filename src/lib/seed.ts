import { Query } from "appwrite";
import { COLLECTIONS, createDocument, listDocuments } from "./db/client";

export async function seedDatabase() {
	console.log("Seeding Appwrite database...");

	try {
		const existingSubjects = await listDocuments(COLLECTIONS.SUBJECTS);

		if (existingSubjects.length > 0) {
			console.log(
				`Database already has ${existingSubjects.length} subjects, skipping seed.`,
			);
			console.log(`   - ${existingSubjects.length} subjects`);
			return;
		}
	} catch {
		// Collection might not exist yet, continue with seeding
	}

	const subjectDefs = [
		{
			name: "Mathematics",
			code: "mathematics",
			category: "mathematics",
			color: "#3b82f6",
			icon: "calculator",
		},
		{
			name: "Physical Sciences",
			code: "physical-sciences",
			category: "sciences",
			color: "#ef4444",
			icon: "flask",
		},
		{
			name: "Life Sciences",
			code: "life-sciences",
			category: "sciences",
			color: "#22c55e",
			icon: "leaf",
		},
		{
			name: "Accounting",
			code: "accounting",
			category: "commerce",
			color: "#f59e0b",
			icon: "book",
		},
		{
			name: "Business Studies",
			code: "business-studies",
			category: "commerce",
			color: "#8b5cf6",
			icon: "briefcase",
		},
		{
			name: "Economics",
			code: "economics",
			category: "commerce",
			color: "#06b6d4",
			icon: "trending-up",
		},
		{
			name: "Geography",
			code: "geography",
			category: "social",
			color: "#10b981",
			icon: "globe",
		},
		{
			name: "History",
			code: "history",
			category: "social",
			color: "#f97316",
			icon: "clock",
		},
	];

	const topicDefs = [
		{
			name: "Calculus",
			subjectCode: "mathematics",
			description: "Differential calculus, Integration, Applications",
		},
		{
			name: "Algebra",
			subjectCode: "mathematics",
			description: "Number patterns, Sequences and series, Finance",
		},
		{
			name: "Trigonometry",
			subjectCode: "mathematics",
			description: "Trigonometric identities, Equations, Graphs",
		},
		{
			name: "Mechanics",
			subjectCode: "physical-sciences",
			description: "Momentum, Newton's Laws, Work, Energy and Power",
		},
		{
			name: "Waves and Sound",
			subjectCode: "physical-sciences",
			description: "Wave properties, Doppler effect, Sound waves",
		},
		{
			name: "Electricity and Magnetism",
			subjectCode: "physical-sciences",
			description: "Electric circuits, Electrostatics, Electrodynamics",
		},
		{
			name: "Matter and Materials",
			subjectCode: "physical-sciences",
			description: "Organic chemistry, Rates of reaction, Chemical equilibrium",
		},
		{
			name: "Genetics",
			subjectCode: "life-sciences",
			description: "DNA, inheritance, genetic engineering",
		},
		{
			name: "Evolution",
			subjectCode: "life-sciences",
			description: "Natural selection, speciation, human evolution",
		},
	];

	for (const s of subjectDefs) {
		try {
			await createDocument(COLLECTIONS.SUBJECTS, s);
		} catch (e) {
			console.error(`Failed to create subject ${s.code}:`, e);
		}
	}
	console.log(`   - ${subjectDefs.length} subjects`);

	const subjectMap = new Map<string, string>();
	for (const s of subjectDefs) {
		try {
			const docs = await listDocuments(COLLECTIONS.SUBJECTS, [
				Query.equal("code", s.code),
				Query.limit(1),
			]);
			if (docs.length > 0) {
				subjectMap.set(
					s.code,
					(docs[0] as Record<string, unknown>).$id as string,
				);
			}
		} catch {
			// skip
		}
	}

	for (const t of topicDefs) {
		const subjectId = subjectMap.get(t.subjectCode);
		if (!subjectId) continue;
		try {
			await createDocument(COLLECTIONS.TOPICS, {
				subjectId,
				name: t.name,
				description: t.description,
				orderIndex: 0,
			});
		} catch (e) {
			console.error(`Failed to create topic ${t.name}:`, e);
		}
	}
	console.log(`   - ${topicDefs.length} topics`);

	console.log("Database seeded successfully!");
}

export async function getUserStats(_userId: string) {
	return {
		totalQuestionsAnswered: 0,
		accuracy: 0,
		currentStreak: 0,
		longestStreak: 0,
	};
}

export async function selectSubject(_userId: string, _subjectId: string) {
	// No-op for now
}
