"use client";

import { useQuery } from "@tanstack/react-query";
import { useUploadStore } from "@/lib/store";
import type { QAFile, QAQuestion } from "@/lib/types/questions";

const MAX_QUESTIONS_PER_FILE = 20;
const FETCH_TIMEOUT = 5000;

function calculateFileCount(totalQuestions: number): number {
	return Math.ceil(totalQuestions / MAX_QUESTIONS_PER_FILE);
}

function generateFileNames(
	subject: string,
	numberOfQuestions: number,
): string[] {
	const fileCount = calculateFileCount(numberOfQuestions);
	const fileNames: string[] = [];

	for (let i = 1; i <= fileCount; i++) {
		fileNames.push(`${subject}_qa_${i}.json`);
	}

	return fileNames;
}

async function fetchSingleFile(
	url: string,
	signal: AbortSignal,
): Promise<QAQuestion[]> {
	const response = await fetch(url, { signal });

	if (!response.ok) {
		throw new Error(`Failed to fetch: ${response.statusText}`);
	}

	const data: QAFile = await response.json();
	return data.questions;
}

async function fetchFilesInParallel(
	fileUrls: string[],
	totalTimeout: number,
): Promise<QAQuestion[]> {
	if (fileUrls.length === 0) return [];

	const controller = new AbortController();
	const overallTimeout = setTimeout(() => controller.abort(), totalTimeout);

	try {
		const fetchPromises = fileUrls.map((url) =>
			fetchSingleFile(url, controller.signal).catch(() => []),
		);
		const results = await Promise.all(fetchPromises);
		return results.flat();
	} finally {
		clearTimeout(overallTimeout);
	}
}

async function discoverQAFileUrls(
	subject: string,
	numberOfQuestions: number,
): Promise<string[]> {
	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

	try {
		const normalized = subject.toLowerCase();
		const url = `/api/list-qa-files?subject=${encodeURIComponent(normalized)}&n=${numberOfQuestions}`;
		const response = await fetch(url, { signal: controller.signal });

		if (!response.ok) {
			throw new Error(`Discovery failed: ${response.statusText}`);
		}

		const result = await response.json();

		if (result.error && (!result.urls || result.urls.length === 0)) {
			return generateFileNames(subject, numberOfQuestions).map(
				(name) =>
					`/api/list-qa-files?subject=${encodeURIComponent(normalized)}&file=${encodeURIComponent(name)}`,
			);
		}

		return result.urls || [];
	} finally {
		clearTimeout(timeout);
	}
}

export async function fetchSubjectQuestions(
	subject: string,
	numberOfQuestions: number,
): Promise<QAQuestion[]> {
	const store = useUploadStore.getState();
	const normalizedSubject = subject.toLowerCase();

	const cached = store.getCachedQuestions(normalizedSubject);
	if (cached && cached.length >= numberOfQuestions) {
		const shuffled = [...cached].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, numberOfQuestions);
	}

	try {
		const questionsUrl = `/api/questions?subject=${encodeURIComponent(normalizedSubject)}`;
		const response = await fetch(questionsUrl);

		if (response.ok) {
			const data = await response.json();
			if (data.questions && Array.isArray(data.questions)) {
				const questions = data.questions as QAQuestion[];
				store.setCachedQuestions(normalizedSubject, questions);
				const shuffled = [...questions].sort(() => Math.random() - 0.5);
				return shuffled.slice(0, numberOfQuestions);
			}
		}
	} catch {
		console.warn("Local questions not found, trying API...");
	}

	const fileUrls = await discoverQAFileUrls(subject, numberOfQuestions);
	const allQuestions: QAQuestion[] = [];

	if (cached && cached.length > 0) {
		allQuestions.push(...cached);
	}

	const fetchedQuestions = await fetchFilesInParallel(
		fileUrls,
		FETCH_TIMEOUT * fileUrls.length,
	);
	allQuestions.push(...fetchedQuestions);

	const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
	const result = shuffled.slice(0, numberOfQuestions);

	store.setCachedQuestions(normalizedSubject, result);

	return result;
}

interface UseSubjectQuestionsOptions {
	enabled?: boolean;
}

export function useSubjectQuestions(
	subject: string,
	numberOfQuestions: number,
	options?: UseSubjectQuestionsOptions,
) {
	return useQuery({
		queryKey: ["subjectQuestions", subject, numberOfQuestions],
		queryFn: () => fetchSubjectQuestions(subject, numberOfQuestions),
		staleTime: 1000 * 60 * 60,
		retry: 1,
		enabled: options?.enabled ?? numberOfQuestions > 0,
	});
}

export function useSubjectQuestionsByDifficulty(
	subject: string,
	numberOfQuestions: number,
	difficulty?: "Easy" | "Medium" | "Hard",
	options?: UseSubjectQuestionsOptions,
) {
	const { data: allQuestions, ...rest } = useSubjectQuestions(
		subject,
		numberOfQuestions,
		options,
	);

	const filteredQuestions = difficulty
		? allQuestions?.filter((q) => q.difficulty === difficulty)
		: allQuestions;

	return {
		...rest,
		data: filteredQuestions,
	};
}
