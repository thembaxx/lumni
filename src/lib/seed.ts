import { ensureAppwrite } from "./db/ensure";
import { seedConfig } from "./db/ensure-config";

export async function seedDatabase() {
	console.log("Seeding Appwrite database...");
	const report = await ensureAppwrite(seedConfig);

	console.log(`Database: ${report.database.status}`);

	for (const [id, col] of Object.entries(report.collections)) {
		console.log(`  Collection "${id}": ${col.status}`);
	}

	for (const [id, seeded] of Object.entries(report.seeded)) {
		console.log(
			`  Seeded "${id}": ${seeded.inserted} inserted, ${seeded.skipped} skipped`,
		);
		for (const err of seeded.errors) {
			console.log(`    Error: ${err}`);
		}
	}

	if (!report.success) {
		throw new Error("Seeding completed with errors");
	}
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
