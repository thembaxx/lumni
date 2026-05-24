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
	try {
		const { offlineDB } = await import("@/lib/db/schema");
		const allAttempts = await offlineDB.table("quizAttempts").toArray();
		const reviewed = allAttempts.filter((a) => a.completedAt);
		const total = reviewed.length;
		const correct = reviewed.filter((a) => a.score === a.maxScore).length;
		const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

		const streakKey = `lumni_streak_${_userId}`;
		const stored =
			typeof localStorage !== "undefined"
				? localStorage.getItem(streakKey)
				: null;
		const currentStreak = stored ? Number.parseInt(stored, 10) || 0 : 0;

		return {
			totalQuestionsAnswered: total,
			accuracy,
			currentStreak,
			longestStreak: currentStreak,
		};
	} catch {
		return {
			totalQuestionsAnswered: 0,
			accuracy: 0,
			currentStreak: 0,
			longestStreak: 0,
		};
	}
}

export async function selectSubject(userId: string, subjectId: string) {
	try {
		const { offlineDB } = await import("@/lib/db/schema");
		await offlineDB
			.table("progress")
			.where("odSubjectId")
			.equals(subjectId)
			.modify({ updatedAt: Date.now() });
		if (typeof localStorage !== "undefined") {
			localStorage.setItem(`lumni_active_subject_${userId}`, subjectId);
		}
	} catch {
		/* non-critical */
	}
}
