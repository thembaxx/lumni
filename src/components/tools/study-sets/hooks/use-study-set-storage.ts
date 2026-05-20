import { useCallback, useState } from "react";

export interface StudySet {
	id: string;
	title: string;
	description: string;
	flashcardIds: string[];
	noteIds: string[];
	flashcards?: { id: string; front: string; back: string }[];
	notes?: { id: string; title: string; content: string }[];
	tags?: string[];
	subject?: string;
	topic?: string;
	createdAt: string;
	updatedAt: string;
	isFavorite?: boolean;
}

export function useStudySetStorage() {
	const [studySets, setStudySets] = useState<StudySet[]>(() => {
		if (typeof window !== "undefined") {
			const saved = localStorage.getItem("lumni-study-sets:v1");
			return saved ? JSON.parse(saved) : [];
		}
		return [];
	});

	const writeLocalStorage = useCallback((sets: StudySet[]) => {
		if (typeof window !== "undefined") {
			localStorage.setItem("lumni-study-sets:v1", JSON.stringify(sets));
		}
	}, []);

	const saveStudySets = useCallback(
		(sets: StudySet[]) => {
			setStudySets(sets);
			writeLocalStorage(sets);
		},
		[writeLocalStorage],
	);

	const addStudySet = useCallback(
		(set: StudySet) => {
			setStudySets((prev) => {
				const next = [...prev, set];
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const removeStudySet = useCallback(
		(id: string) => {
			setStudySets((prev) => {
				const next = prev.filter((set) => set.id !== id);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const updateStudySet = useCallback(
		(id: string, updates: Partial<StudySet>) => {
			setStudySets((prev) => {
				const next = prev.map((set) =>
					set.id === id
						? { ...set, ...updates, updatedAt: new Date().toISOString() }
						: set,
				);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	const toggleFavorite = useCallback(
		(id: string) => {
			setStudySets((prev) => {
				const next = prev.map((set) =>
					set.id === id ? { ...set, isFavorite: !set.isFavorite } : set,
				);
				writeLocalStorage(next);
				return next;
			});
		},
		[writeLocalStorage],
	);

	return {
		studySets,
		addStudySet,
		removeStudySet,
		updateStudySet,
		toggleFavorite,
		saveStudySets,
	};
}
