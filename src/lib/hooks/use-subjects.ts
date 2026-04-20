"use client";

import { useQuery } from "@tanstack/react-query";

export interface Subject {
	id: string;
	name: string;
	description: string;
}

const SUBJECTS_URL =
	"https://sxo07lk073.ufs.sh/f/yddsZUgag8v0rbO31IeUiGpNZwDsqvnL0PV8y54a6ftQoFd9";

async function fetchSubjects(): Promise<Subject[]> {
	const response = await fetch(SUBJECTS_URL);
	if (!response.ok) {
		throw new Error("Failed to fetch subjects");
	}
	return response.json();
}

export function useSubjects() {
	return useQuery({
		queryKey: ["subjects"],
		queryFn: fetchSubjects,
		staleTime: 1000 * 60 * 60,
		retry: 2,
	});
}

export function useFilteredSubjects(searchQuery: string) {
	const { data: subjects, ...rest } = useSubjects();

	const filteredSubjects = subjects
		?.filter((subject) =>
			subject.name.toLowerCase().includes(searchQuery.toLowerCase()),
		)
		.sort((a, b) => a.name.localeCompare(b.name));

	return {
		...rest,
		data: filteredSubjects,
		subjects,
	};
}
