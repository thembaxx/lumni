import { UTApi, UTFile } from "uploadthing/server";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function uploadQAFileSubject(
	jsonContent: string,
	subject: string,
	fileNumber: number = 1,
): Promise<{ success: boolean; url?: string; key?: string; error?: string }> {
	try {
		const fileName = generateFileName(subject, fileNumber);

		const file = new UTFile([jsonContent], fileName);
		const utapi = new UTApi();
		const result = await utapi.uploadFiles(file);

		if (!result || typeof result !== "object") {
			return { success: false, error: "Upload failed - no result" };
		}

		const uploadResult = result as unknown as { url?: string; key?: string };

		return {
			success: true,
			url: uploadResult.url,
			key: uploadResult.key,
		};
	} catch (error) {
		console.error("Upload error:", error);
		return {
			success: false,
			error: error instanceof Error ? error.message : "Upload failed",
		};
	}
}

export { formatSubjectName, generateFileName };
