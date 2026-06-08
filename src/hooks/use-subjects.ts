"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef } from "react";
import subjectsData from "@/data/subjects.json";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess, type LegacyDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

let _deps: { db: LegacyDataAccess } = { db: dexieDataAccess };
function __setDepsForTesting(deps: { db: LegacyDataAccess }) {
	_deps = deps;
}

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
	} catch (err) {
		logError("FetchSubjects", err);
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
			await _deps.db.subjects
				.bulkAdd(
					subjects.map((s) => ({
						code: s.code,
						name: s.name,
						category: s.category,
						data: JSON.stringify(s),
						cachedAt: Date.now(),
					})),
				)
				.catch((err) => {
					logError("UseSubjects", err);
				});
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

	const subjectIdsRef = useRef(prefsSubjects);
	subjectIdsRef.current = prefsSubjects;

	const migratePrefsSubjects = useCallback(async () => {
		if (!user || !data || data.selectedSubjectIds.length > 0) return;
		const currentPrefs = subjectIdsRef.current;
		const subjectIds = currentPrefs.flatMap((name) => {
			const sub = subjectsData.find(
				(s) => s.name.toLowerCase() === name.toLowerCase(),
			);
			return sub?.id ? [sub.id] : [];
		}) as string[];

		if (subjectIds.length > 0) {
			try {
				await fetch("/api/subjects/enroll", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ subjectIds }),
				});
				queryClient.invalidateQueries({ queryKey: ["subjects"] });
			} catch (e) {
				logError("MigratePrefsSubjects", e);
				console.warn("[Subjects] Failed to migrate preferences", e);
			}
		}
	}, [user, data, queryClient]);

	useEffect(() => {
		if (!migrated.current && prefsSubjects.length > 0) {
			migrated.current = true;
			migratePrefsSubjects();
		}
	}, [migratePrefsSubjects, prefsSubjects.length]);

	const subjects = useMemo(
		() => data?.subjects ?? (subjectsData as Subject[]),
		[data?.subjects],
	);
	const selectedIds = useMemo(() => {
		let ids = data?.selectedSubjectIds ?? [];
		if (!user && ids.length === 0) {
			const stored = getLocalEnrolledSubjects();
			if (stored.length > 0) {
				ids = stored;
			}
		}
		return ids;
	}, [data?.selectedSubjectIds, user]);

	const enrolled = useMemo(
		() => subjects.filter((s) => selectedIds.includes(s.id)),
		[subjects, selectedIds],
	);

	return {
		subjects,
		enrolledSubjects: enrolled,
		selectedSubjectIds: selectedIds,
		isEnrolled: useCallback(
			(subjectId: string) => selectedIds.includes(subjectId),
			[selectedIds],
		),
	};
}

function getLocalEnrolledSubjects(): string[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = localStorage.getItem("lumni_onboarding");
		if (!raw) return [];
		const data = JSON.parse(raw);
		return Array.isArray(data.selectedSubjects) ? data.selectedSubjects : [];
	} catch (err) {
		logError("GetLocalEnrolledSubjects", err);
		return [];
	}
}

export function saveLocalEnrolledSubjects(subjectIds: string[]): void {
	if (typeof window === "undefined") return;
	try {
		const raw = localStorage.getItem("lumni_onboarding:v1");
		const data = raw ? JSON.parse(raw) : {};
		data.selectedSubjects = subjectIds;
		localStorage.setItem("lumni_onboarding:v1", JSON.stringify(data));
	} catch (e) {
		logError("SaveLocalEnrolledSubjects", e);
		console.warn("[Subjects] Failed to save local enrollment", e);
	}
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
