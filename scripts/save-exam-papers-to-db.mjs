import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, "../.env.local") });

const API_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

async function main() {
	const inputFile = path.join(__dirname, "../exam-papers-uploaded.json");
	const uploads = JSON.parse(fs.readFileSync(inputFile, "utf-8"));

	console.log(`Found ${uploads.length} upload records to import\n`);
	console.log("=".repeat(50));

	const response = await fetch(`${API_URL}/api/import-exam-papers`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ uploads }),
	});

	const result = await response.json();

	console.log(`\nImport Complete!`);
	console.log(`Imported: ${result.imported} records`);
	console.log(`Skipped: ${result.skipped} records`);

	if (result.errors && result.errors.length > 0) {
		console.log(`\nErrors:`);
		for (const error of result.errors) {
			console.log(`  - ${error}`);
		}
	}
}

main().catch(console.error);