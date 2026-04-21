import { create } from "zustand";
import type { QAQuestion } from "@/lib/types/questions";

export interface UploadSubject {
	routeKey: string;
	fileTypes: string[];
	maxFileSize: string;
	maxFileCount: number;
	name: string;
}

interface UploadStore {
	subjects: UploadSubject[];
	isLoading: boolean;
	error: Error | null;
	cachedQuestions: Map<string, QAQuestion[]>;

	setSubjects: (subjects: UploadSubject[]) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: Error | null) => void;
	getSubject: (routeKey: string) => UploadSubject | undefined;
	getCachedQuestions: (subject: string) => QAQuestion[] | undefined;
	setCachedQuestions: (subject: string, questions: QAQuestion[]) => void;
	appendCachedQuestions: (subject: string, questions: QAQuestion[]) => void;
	clearQuestionCache: () => void;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
	subjects: [],
	isLoading: false,
	error: null,
	cachedQuestions: new Map(),

	setSubjects: (subjects) => set({ subjects, error: null }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error, isLoading: false }),

	getSubject: (routeKey) => {
		return get().subjects.find((s) => s.routeKey === routeKey);
	},

	getCachedQuestions: (subject: string) => {
		const normalizedSubject = subject.toLowerCase();
		return get().cachedQuestions.get(normalizedSubject);
	},

	setCachedQuestions: (subject: string, questions: QAQuestion[]) => {
		const normalizedSubject = subject.toLowerCase();
		const newCache = new Map(get().cachedQuestions);
		newCache.set(normalizedSubject, questions);
		set({ cachedQuestions: newCache });
	},

	appendCachedQuestions: (subject: string, questions: QAQuestion[]) => {
		const normalizedSubject = subject.toLowerCase();
		const newCache = new Map(get().cachedQuestions);
		const existing = newCache.get(normalizedSubject) || [];
		newCache.set(normalizedSubject, [...existing, ...questions]);
		set({ cachedQuestions: newCache });
	},

	clearQuestionCache: () => set({ cachedQuestions: new Map() }),
}));

interface AppStore {
	isInitialized: boolean;
	setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
	isInitialized: false,
	setInitialized: (isInitialized) => set({ isInitialized }),
}));
