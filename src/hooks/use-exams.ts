"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { ExamFilter, ExamGroup, PaperListing } from "@/types/exam";

interface AppwriteExam {
	id: string;
	subject: string;
	paperCode: string;
	examPeriod: string;
	year: number;
	grade: number;
	language: string;
	totalMarks: number;
	duration: string;
	fileKeys: { pdf: string; markdown: string; json: string } | null;
	uploadedAt: string;
}

async function fetchExams(): Promise<PaperListing[]> {
	const res = await fetch("/api/admin/exams");
	if (!res.ok) return [];
	const data = await res.json();
	const appwriteExams = (data.exams || []) as AppwriteExam[];
	return appwriteExams.map((e) => ({
		id: e.id,
		subject: e.subject,
		subjectId: e.subject.toLowerCase().replace(/\s+/g, "-"),
		year: e.year,
		session: e.examPeriod.toLowerCase().includes("june")
			? ("may-june" as const)
			: ("november" as const),
		type: "paper" as const,
		paperNumber: parseInt(e.paperCode?.replace("P", "") || "1", 10),
		language: e.language?.toLowerCase() as "english" | "afrikaans" | undefined,
		title: `${e.subject} ${e.paperCode} ${e.examPeriod}`,
		url: "",
		fileUrl: e.fileKeys?.pdf || undefined,
		fileKey: e.fileKeys?.json || undefined,
	}));
}

export function useExams(filter: ExamFilter) {
	const {
		data: exams = [],
		isLoading,
		error,
	} = useQuery({
		queryKey: ["admin-exams"],
		queryFn: fetchExams,
		staleTime: 5 * 60 * 1000,
	});

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

		if (filter.language) {
			results = results.filter(
				(exam) =>
					exam.language?.toLowerCase() === filter.language?.toLowerCase(),
			);
		}

		return results;
	}, [exams, filter]);

	const groupedExams = useMemo<ExamGroup[]>(() => {
		const grouped = new Map<string, PaperListing[]>();

		filteredExams.forEach((exam) => {
			const existing = grouped.get(exam.subject) || [];
			grouped.set(exam.subject, [...existing, exam]);
		});

		return Array.from(grouped.entries())
			.map(([subject, papers]) => ({
				subject,
				papers: papers.sort((a, b) => {
					if (a.year !== b.year) return b.year - a.year;
					return 0;
				}),
			}))
			.sort((a, b) => a.subject.localeCompare(b.subject));
	}, [filteredExams]);

	return {
		exams: filteredExams,
		groupedExams,
		isLoading,
		error: error?.message ?? null,
	};
}

export type { ExamFilter, ExamGroup, PaperListing } from "@/types/exam";
