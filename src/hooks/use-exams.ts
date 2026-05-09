"use client";

import { useEffect, useMemo, useState } from "react";
import examData from "@/data/exams/index.json";
import { getExamPapersWithFallback, checkAndPopulateExamsDb } from "@/lib/server";
import type { ExamFilter, ExamGroup, ExamPaper } from "@/types/exam";

export function useExams(filter: ExamFilter) {
	const [exams, setExams] = useState<ExamPaper[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		async function fetchExams() {
			try {
				setIsLoading(true);

				await checkAndPopulateExamsDb();

				const dbExams = await getExamPapersWithFallback();

				if (dbExams && dbExams.length > 0) {
					setExams(dbExams);
				} else {
					setExams(examData.exams as ExamPaper[]);
				}
			} catch (err) {
				console.warn("Database unavailable, using fallback data:", err instanceof Error ? err.message : "Unknown error");
				setExams(examData.exams as ExamPaper[]);
			} finally {
				setIsLoading(false);
			}
		}

		fetchExams();
	}, []);

	const filteredExams = useMemo(() => {
		let results = exams;

		if (filter.search) {
			const searchLower = filter.search.toLowerCase();
			results = results.filter(
				(exam) =>
					exam.subject.toLowerCase().includes(searchLower) ||
					exam.title.toLowerCase().includes(searchLower),
			);
		}

		if (filter.year) {
			results = results.filter((exam) => exam.year === filter.year);
		}

		if (filter.subject) {
			results = results.filter(
				(exam) => exam.subject.toLowerCase() === filter.subject?.toLowerCase(),
			);
		}

		if (filter.session && filter.session !== "all") {
			results = results.filter((exam) => {
				if (filter.session === "may") {
					return exam.session === "may-june";
				}
				if (filter.session === "nov") {
					return exam.session === "november";
				}
				return true;
			});
		}

		return results;
	}, [exams, filter]);

	const groupedExams = useMemo<ExamGroup[]>(() => {
		const grouped = new Map<string, ExamPaper[]>();

		filteredExams.forEach((exam) => {
			const existing = grouped.get(exam.subject) || [];
			grouped.set(exam.subject, [...existing, exam]);
		});

		return Array.from(grouped.entries())
			.map(([subject, papers]) => ({
				subject,
				papers: papers.sort((a, b) => {
					if (a.year !== b.year) return b.year - a.year;
					if (a.session !== b.session) return a.session === "november" ? -1 : 1;
					return 0;
				}),
			}))
			.sort((a, b) => a.subject.localeCompare(b.subject));
	}, [filteredExams]);

	return {
		exams: filteredExams,
		groupedExams,
		isLoading,
		error,
	};
}

export type { ExamFilter, ExamGroup, ExamPaper } from "@/types/exam";
