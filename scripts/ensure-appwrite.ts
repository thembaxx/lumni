import { Client, Databases } from "node-appwrite";
import dotenv from "dotenv";
import { ensureAppwrite, type EnsureReport } from "@/lib/db/ensure";
import { seedConfig } from "@/lib/db/ensure-config";
dotenv.config({ path: ".env.local" });

const endpoint =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://cloud.appwrite.io/v1";
const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const apiKey = process.env.APPWRITE_API_KEY || "";

const databaseId = process.env.APPWRITE_DATABASE_ID || "lumni";

async function main() {
	if (!project) {
		console.error(
			"Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in environment",
		);
		process.exit(1);
	}
	if (!apiKey) {
		console.error("Missing APPWRITE_API_KEY in environment");
		process.exit(1);
	}

	console.log(`Connecting to Appwrite: ${endpoint}`);
	console.log(`  Project: ${project}`);
	console.log(`  Database: ${databaseId}`);
	console.log();

	const report: EnsureReport = await ensureAppwrite(seedConfig);

	console.log("=== Ensure Report ===");
	console.log(`Database: ${report.database.status}`);
	if (report.database.error) {
		console.log(`  Error: ${report.database.error}`);
	}

	for (const [id, col] of Object.entries(report.collections)) {
		const parts = [`Collection "${id}": ${col.status}`];
		if ((col as Record<string, unknown>).attributesCreated) {
			parts.push(
				`${(col as Record<string, unknown>).attributesCreated} attrs`,
			);
		}
		if ((col as Record<string, unknown>).indexesCreated) {
			parts.push(
				`${(col as Record<string, unknown>).indexesCreated} indexes`,
			);
		}
		console.log(parts.join(", "));
		if (col.error) console.log(`  Error: ${col.error}`);
	}

	for (const [id, seeded] of Object.entries(report.seeded)) {
		console.log(
			`Seeded "${id}": ${seeded.inserted} inserted, ${seeded.skipped} skipped`,
		);
		for (const err of seeded.errors) {
			console.log(`  Error: ${err}`);
		}
	}

	console.log();
	if (report.success) {
		console.log("Done.");
		process.exit(0);
	} else {
		console.error("Completed with errors.");
		process.exit(1);
	}
}

main().catch((err) => {
	console.error("Fatal error:", err);
	process.exit(1);
});
