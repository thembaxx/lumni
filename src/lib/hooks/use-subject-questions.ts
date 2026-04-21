"use client";

import { useQuery } from "@tanstack/react-query";
import type { QAFile, QAQuestion } from "@/lib/types/questions";

const UPLOADTHING_BASE_URL = process.env.NEXT_PUBLIC_UPLOADTHING_BASE_URL!;
const MAX_QUESTIONS_PER_FILE = 20;

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

async function fetchSingleFile(fileName: string): Promise<QAQuestion[]> {
	const url = `${UPLOADTHING_BASE_URL}/${fileName}`;
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch ${fileName}: ${response.statusText}`);
	}

	const data: QAFile = await response.json();
	return data.questions;
}

export async function fetchSubjectQuestions(
	subject: string,
	numberOfQuestions: number,
): Promise<QAQuestion[]> {
	const fileNames = generateFileNames(subject, numberOfQuestions);
	const allQuestions: QAQuestion[] = [];

	for (const fileName of fileNames) {
		try {
			const questions = await fetchSingleFile(fileName);
			allQuestions.push(...questions);
		} catch {
			console.warn(`Could not fetch ${fileName}, skipping...`);
		}
	}

	const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, numberOfQuestions);
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
		staleTime: 1000 * 60 * 30,
		retry: 2,
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
