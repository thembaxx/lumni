function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function _generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function uploadQAFile(
	jsonContent: string,
	subject: string,
	fileNumber: number = 1,
): Promise<{
	success: boolean;
	url?: string;
	fileName?: string;
	error?: string;
}> {
	try {
		const fileName = _generateFileName(subject, fileNumber);

		const formData = new FormData();
		formData.append(
			"file",
			new Blob([jsonContent], { type: "application/json" }),
			fileName,
		);
		formData.append("subject", subject);
		formData.append("number", String(fileNumber));

		const response = await fetch("/api/upload-qa", {
			method: "POST",
			body: formData,
		});

		const result = await response.json();

		if (!response.ok) {
			return {
				success: false,
				error: result.error || "Upload failed",
			};
		}

		return {
			success: true,
			url: result.url,
			fileName: result.fileName,
		};
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Upload failed",
		};
	}
}

export async function uploadQAFileFromPath(
	filePath: string,
	subject: string,
	fileNumber: number = 1,
): Promise<{
	success: boolean;
	url?: string;
	fileName?: string;
	error?: string;
}> {
	const fs = await import("fs");
	const fileContent = fs.readFileSync(filePath, "utf-8");
	return uploadQAFile(fileContent, subject, fileNumber);
}

export { _generateFileName, formatSubjectName };
