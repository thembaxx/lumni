const fs = require("fs");
const path = require("path");

const UPLOADTHING_API_KEY = "sk_live_1b8a5c20c50736beef5d7d6f61459ad91d202aabc361d1bc62628cb52ebacb35";
const APP_ID = "sxo07lk073";

function formatSubjectName(subject) {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject, number) {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

async function uploadFile(filePath, subject, fileNumber = 1) {
	const fileName = generateFileName(subject, fileNumber);
	const fileContent = fs.readFileSync(filePath);
	const fileSize = fileContent.length;

	console.log(`Uploading ${fileName} (${fileSize} bytes)...`);

	const response = await fetch("http://localhost:3000/api/uploadthing", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			route: "qaUploader",
			files: [{
				name: fileName,
				type: "application/json",
				size: fileSize,
				content: fileContent.toString("base64"),
			}],
		}),
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(`Failed: ${response.status} - ${errorText}`);
	}

	const result = await response.json();
	const fileUrl = result[0]?.url;
	console.log(`Uploaded successfully: ${fileUrl}`);
	return fileUrl;
}

async function main() {
	const args = process.argv.slice(2);
	const filePath = args[0] || "physical_sciences_qa_1.json";
	const subject = args[1] || "physical_sciences";
	const fileNumber = Number(args[2]) || 1;

	try {
		const url = await uploadFile(filePath, subject, fileNumber);
		console.log("\nFile uploaded!");
		console.log(`URL: ${url}`);
		process.exit(0);
	} catch (error) {
		console.error("Error:", error.message);
		process.exit(1);
	}
}

main();