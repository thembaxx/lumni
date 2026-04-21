"use server";

import { writeFile, unlink } from "fs/promises";
import { join } from "path";

function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

export async function uploadQAFile(
	file: File,
	subject: string,
	fileNumber: number = 1,
): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
	try {
		const fileName = generateFileName(subject, fileNumber);
		const tempPath = join(process.cwd(), "tmp", fileName);

		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		await writeFile(tempPath, buffer);

		const formData = new FormData();
		formData.append("file", new File([buffer], fileName));

		const response = await fetch("http://localhost:3000/api/uploadthing", {
			method: "POST",
			body: formData,
		});

		await unlink(tempPath);

		if (!response.ok) {
			const error = await response.text();
			return { success: false, error };
		}

		const result = await response.json();
		return {
			success: true,
			url: result[0]?.url,
			fileName,
		};
	} catch (error) {
		console.error("Upload error:", error);
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
): Promise<{ success: boolean; url?: string; fileName?: string; error?: string }> {
	try {
		const fs = await import("fs/promises");
		const fileContent = await fs.readFile(filePath, "utf-8");
		const file = new File([fileContent], "temp.json", { type: "application/json" });
		return uploadQAFile(file, subject, fileNumber);
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Upload failed",
		};
	}
}

export { formatSubjectName, generateFileName };