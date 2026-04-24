import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDir = path.join(__dirname, "../downloads/exam-papers-2025");
const outputFile = path.join(__dirname, "../exam-papers-uploaded.json");

dotenv.config({ path: path.join(__dirname, "../.env.local") });

function normalizeSubjectCode(filename) {
	return filename.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");
}

function parseExamPaperFilename(filename) {
	// Matches: 2025_subject_paperNumber[_memo].pdf
	// Subject can have hyphens or underscores (convert to hyphen internally)
	const match = filename.match(/^(\d{4})_(.+)_p(\d+)(_memo)?\.pdf$/i);
	if (!match) return null;

	return {
		year: parseInt(match[1], 10),
		subjectCode: match[2].replace(/_/g, "-"), // Normalize underscores to hyphens
		paperNumber: parseInt(match[3], 10),
		type: match[4] ? "memo" : "paper",
		originalFileName: filename,
	};
}

async function uploadFile(filePath) {
	const fileName = path.basename(filePath);
	const { UTApi, UTFile } = await import("uploadthing/server");

	const fileContent = fs.readFileSync(filePath);
	const utFile = new UTFile([fileContent], fileName);

	const utapi = new UTApi();
	const result = await utapi.uploadFiles(utFile);

	if (!result?.data) {
		throw new Error(result?.error?.message || "Upload failed");
	}

	const fileUrl = result.data.ufsUrl || result.data.url;
	const fileKey = result.data.key;

	return { fileUrl, fileKey };
}

async function main() {
	const files = fs.readdirSync(baseDir).filter((f) => f.endsWith(".pdf"));

	console.log(`\nFound ${files.length} PDF files to upload\n`);
	console.log("=".repeat(50));

	const uploads = [];

	for (const file of files) {
		const filePath = path.join(baseDir, file);
		const parsed = parseExamPaperFilename(file);

		if (!parsed) {
			console.log(`Skipping (unparseable): ${file}`);
			continue;
		}

		console.log(`Uploading: ${file}...`);

		try {
			const { fileUrl, fileKey } = await uploadFile(filePath);
			console.log(`  -> Success: ${fileUrl}`);

			uploads.push({
				...parsed,
				fileUrl,
				fileKey,
			});
		} catch (error) {
			console.error(`  -> Failed: ${error.message}`);
		}
	}

	fs.writeFileSync(outputFile, JSON.stringify(uploads, null, 2));
	console.log(`\nSaved upload results to: ${outputFile}`);
	console.log(`Successful uploads: ${uploads.length}`);
}

main().catch(console.error);