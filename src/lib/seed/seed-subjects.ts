import "dotenv/config";
import { Client, Databases, Query } from "node-appwrite";
import subjectsData from "@/data/subjects.json";

const API_ENDPOINT =
	process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ||
	"https://jnb.cloud.appwrite.io/v1";
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";
const API_KEY = process.env.APPWRITE_API_KEY || "";
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "";

interface SubjectSeed {
	id: string;
	name: string;
	code: string;
	description: string;
	icon: string;
	category: string;
	color: string;
}

async function seedSubjects() {
	if (!PROJECT_ID) {
		console.error("Missing NEXT_PUBLIC_APPWRITE_PROJECT_ID in environment");
		process.exit(1);
	}
	if (!API_KEY) {
		console.error("Missing APPWRITE_API_KEY in environment");
		process.exit(1);
	}
	if (!DATABASE_ID) {
		console.error("Missing APPWRITE_DATABASE_ID in environment");
		process.exit(1);
	}

	const client = new Client()
		.setEndpoint(API_ENDPOINT)
		.setProject(PROJECT_ID)
		.setKey(API_KEY);

	const db = new Databases(client);
	const subjects = subjectsData as SubjectSeed[];

	console.log(`Seeding ${subjects.length} subjects to Appwrite...\n`);

	let inserted = 0;
	let skipped = 0;
	const errors: string[] = [];

	for (const subject of subjects) {
		try {
			const existing = await db.listDocuments(DATABASE_ID, "subjects", [
				Query.equal("code", subject.code),
				Query.limit(1),
			]);

			if (existing.documents.length > 0) {
				console.log(`  SKIP  ${subject.name} (already exists)`);
				skipped++;
				continue;
			}

			await db.createDocument(DATABASE_ID, "subjects", subject.id, {
				name: subject.name,
				code: subject.code,
				description: subject.description,
				icon: subject.icon,
				category: subject.category,
				color: subject.color,
			});
			console.log(`  OK    ${subject.name}`);
			inserted++;
		} catch (err) {
			const msg = err instanceof Error ? err.message : String(err);
			errors.push(`${subject.name}: ${msg}`);
			console.error(`  ERR   ${subject.name}: ${msg}`);
		}
	}

	console.log(`\nResults: ${inserted} inserted, ${skipped} skipped`);
	if (errors.length > 0) {
		console.error(`Errors: ${errors.length}`);
		process.exit(1);
	}
}

seedSubjects();
