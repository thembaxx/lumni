import { readFileSync } from "node:fs";
import { uploadQAFileSubject } from "@/lib/server/upload-qa-json";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

interface UploadOptions {
	filePath: string;
	subject: string;
	fileNumber?: number;
}

async function uploadFile({
	filePath,
	subject,
	fileNumber = 1,
}: UploadOptions): Promise<string | null> {
	const fileContent = readFileSync(filePath);
	const fileSize = fileContent.length;
	const fileName = generateFileName(subject, fileNumber);

	console.log(`Uploading ${fileName} (${fileSize} bytes)...`);

	const result = await uploadQAFileSubject(
		fileContent.toString("utf-8"),
		subject,
		fileNumber,
	);

	if (!result.success) {
		throw new Error(`Upload failed: ${result.error}`);
	}

	console.log(`Uploaded successfully: ${result.url}`);
	return result.url ?? null;
}

async function main() {
	const args = process.argv.slice(2);
	const filePath = args[0] || "physical_sciences_qa_1.json";
	const subject = args[1] || "physical_sciences";
	const fileNumber = Number(args[2]) || 1;

	try {
		const url = await uploadFile({ filePath, subject, fileNumber });
		if (url) {
			console.log("\nFile uploaded!");
			console.log(`URL: ${url}`);
			process.exit(0);
		} else {
			console.error("No URL returned from upload");
			process.exit(1);
		}
	} catch (error) {
		console.error(
			"Error:",
			error instanceof Error ? error.message : "Unknown error",
		);
		process.exit(1);
	}
}

main();
