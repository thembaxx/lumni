function formatSubjectName(subject: string): string {
	return subject.replace(/\s+/g, "_").toLowerCase();
}

function generateFileName(subject: string, number: number): string {
	const formattedSubject = formatSubjectName(subject);
	return `${formattedSubject}_qa_${number}.json`;
}

function generateExamPaperFileName(
	year: number,
	subject: string,
	paper: number,
	isMemo: boolean = false,
): string {
	const formattedSubject = formatSubjectName(subject);
	const suffix = isMemo ? "_memo" : "";
	return `${year}_${formattedSubject}_p${paper}${suffix}.pdf`;
}

interface UTUploadResponse {
	url: string;
	name: string;
	appId: string;
}

export async function uploadSubjectQuestions(
	subject: string,
	number: number,
	file: File,
): Promise<UTUploadResponse> {
	const fileName = generateFileName(subject, number);
	const formData = new FormData();
	formData.append("file", file);
	formData.append("filename", fileName);

	const response = await fetch("/api/uploadthing", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Upload failed: ${response.statusText}`);
	}

	const result = await response.json();
	return {
		url: result.url,
		name: fileName,
		appId: result.appId,
	};
}

export function getQuestionFileUrl(
	subject: string,
	number: number,
	baseUrl?: string,
): string {
	const fileName = generateFileName(subject, number);
	const base = baseUrl || "";
	return `${base}/${fileName}`;
}

export async function fetchSubjectQuestionsFiles(
	subject: string,
	totalQuestions: number,
	baseUrl?: string,
): Promise<string[]> {
	const files: string[] = [];
	const maxQuestionsPerFile = 20;
	const numberOfFiles = Math.ceil(totalQuestions / maxQuestionsPerFile);

	for (let i = 1; i <= numberOfFiles; i++) {
		files.push(getQuestionFileUrl(subject, i, baseUrl));
	}

	return files;
}

export { formatSubjectName, generateFileName };

export async function uploadExamPaper(
	year: number,
	subject: string,
	paper: number,
	file: File,
	isMemo: boolean = false,
): Promise<UTUploadResponse> {
	const fileName = generateExamPaperFileName(year, subject, paper, isMemo);
	const formData = new FormData();
	formData.append("file", file);
	formData.append("filename", fileName);

	const response = await fetch("/api/uploadthing", {
		method: "POST",
		body: formData,
	});

	if (!response.ok) {
		throw new Error(`Exam paper upload failed: ${response.statusText}`);
	}

	const result = await response.json();
	return {
		url: result.url,
		name: fileName,
		appId: result.appId,
	};
}

export function getExamPaperUrl(
	year: number,
	subject: string,
	paper: number,
	isMemo: boolean = false,
	baseUrl?: string,
): string {
	const fileName = generateExamPaperFileName(year, subject, paper, isMemo);
	const base = baseUrl || "";
	return `${base}/${fileName}`;
}
