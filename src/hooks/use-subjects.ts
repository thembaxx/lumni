"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import subjectsData from "@/data/subjects.json";
import { useAuth } from "@/lib/auth/auth-context";
import { offlineDB } from "@/lib/db/schema";

export interface Subject {
	id: string;
	name: string;
	code: string;
	description: string;
	icon: string;
	category: string;
	color: string;
	createdAt?: string;
}

interface SubjectsResponse {
	subjects: Subject[];
	selectedSubjectIds: string[];
}

async function fetchSubjects(): Promise<SubjectsResponse> {
	try {
		const response = await fetch("/api/subjects");
		if (!response.ok) {
			throw new Error(`Failed to fetch subjects: ${response.status}`);
		}
		const data = (await response.json()) as {
			subjects: Subject[];
			selectedSubjectIds?: string[];
		};
		return {
			subjects: data.subjects ?? (subjectsData as Subject[]),
			selectedSubjectIds: data.selectedSubjectIds ?? [],
		};
	} catch {
		return {
			subjects: subjectsData as Subject[],
			selectedSubjectIds: [],
		};
	}
}

export function useSubjects() {
	return useQuery({
		queryKey: ["subjects"],
		queryFn: async () => {
			const { subjects, selectedSubjectIds } = await fetchSubjects();
			await offlineDB.subjects
				.bulkPut(
					subjects.map((s) => ({
						code: s.code,
						name: s.name,
						category: s.category,
						data: JSON.stringify(s),
						cachedAt: Date.now(),
					})),
				)
				.catch(() => {});
			return { subjects, selectedSubjectIds };
		},
		staleTime: 1000 * 60 * 60,
		retry: 2,
		initialData: {
			subjects: subjectsData as Subject[],
			selectedSubjectIds: [] as string[],
		},
	});
}

export function useEnrolledSubjects() {
	const { user } = useAuth();
	const { data } = useSubjects();
	const queryClient = useQueryClient();
	const migrated = useRef(false);

	const prefs = user?.prefs as Record<string, unknown> | undefined;
	const prefsSubjects = (prefs?.subjects as string[]) ?? [];

	useEffect(() => {
		if (
			!migrated.current &&
			user &&
			data &&
			data.selectedSubjectIds.length === 0 &&
			prefsSubjects.length > 0
		) {
			migrated.current = true;
			const subjectIds = prefsSubjects
				.map((name) => {
					const sub = subjectsData.find(
						(s) => s.name.toLowerCase() === name.toLowerCase(),
					);
					return sub?.id;
				})
				.filter(Boolean) as string[];

			if (subjectIds.length > 0) {
				fetch("/api/subjects/enroll", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subjectIds }),
				})
					.then(() => {
						queryClient.invalidateQueries({ queryKey: ["subjects"] });
					})
					.catch(() => {});
			}
		}
	}, [user, data, prefsSubjects, queryClient]);

	const subjects = data?.subjects ?? (subjectsData as Subject[]);
	let selectedIds = data?.selectedSubjectIds ?? [];

	if (!user && selectedIds.length === 0) {
		const stored = getLocalEnrolledSubjects();
		if (stored.length > 0) {
			selectedIds = stored;
		}
	}

	const enrolled = subjects.filter((s) => selectedIds.includes(s.id));

	return {
		subjects,
		enrolledSubjects: enrolled,
		selectedSubjectIds: selectedIds,
		isEnrolled: (subjectId: string) => selectedIds.includes(subjectId),
	};
}

export function getLocalEnrolledSubjects(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem("lumni_onboarding");
		if (!raw) return [];
		const data = JSON.parse(raw);
		return Array.isArray(data.selectedSubjects) ? data.selectedSubjects : [];
	} catch {
		return [];
	}
}

export function saveLocalEnrolledSubjects(subjectIds: string[]): void {
	if (typeof window === "undefined") return;
	try {
		const raw = localStorage.getItem("lumni_onboarding");
		const data = raw ? JSON.parse(raw) : {};
		data.selectedSubjects = subjectIds;
		localStorage.setItem("lumni_onboarding", JSON.stringify(data));
	} catch {}
}

export function useFilteredSubjects(searchQuery: string, enrolledOnly = false) {
	const { data, ...rest } = useSubjects();
	const { enrolledSubjects } = useEnrolledSubjects();

	const source = enrolledOnly
		? enrolledSubjects
		: (data?.subjects ?? (subjectsData as Subject[]));

	const filteredSubjects = source
		.filter((subject) =>
			subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.toSorted((a, b) => a.name.localeCompare(b.name));

	return {
		...rest,
		data: filteredSubjects,
		subjects: data?.subjects ?? (subjectsData as Subject[]),
		enrolledSubjects,
	};
}
