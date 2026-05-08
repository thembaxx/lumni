"use client";

import { useQuery } from "@tanstack/react-query";
import subjectsData from "@/data/subjects.json";

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

async function fetchSubjects(): Promise<Subject[]> {
	try {
		const response = await fetch("/api/subjects");
		if (!response.ok) {
			throw new Error(`Failed to fetch subjects: ${response.status}`);
		}
		const data = await response.json();
		if (!data.subjects) {
			throw new Error("Invalid response: missing subjects data");
		}
		return data.subjects;
	} catch {
		return subjectsData as Subject[];
	}
}

export function useSubjects() {
	return useQuery({
		queryKey: ["subjects"],
		queryFn: fetchSubjects,
		staleTime: 1000 * 60 * 60,
		retry: 2,
		initialData: subjectsData as Subject[],
	});
}

export function useFilteredSubjects(searchQuery: string) {
	const { data: subjects, ...rest } = useSubjects();

	const filteredSubjects = subjects
		?.filter((subject) =>
			subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.toSorted((a, b) => a.name.localeCompare(b.name));

	return {
		...rest,
		data: filteredSubjects,
		subjects,
	};
}
