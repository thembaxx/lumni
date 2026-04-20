import { create } from "zustand";

export interface UploadSubject {
	routeKey: string;
	fileTypes: string[];
	maxFileSize: string;
	maxFileCount: number;
}

interface UploadStore {
	subjects: UploadSubject[];
	isLoading: boolean;
	error: Error | null;

	setSubjects: (subjects: UploadSubject[]) => void;
	setLoading: (isLoading: boolean) => void;
	setError: (error: Error | null) => void;
	getSubject: (routeKey: string) => UploadSubject | undefined;
}

export const useUploadStore = create<UploadStore>((set, get) => ({
	subjects: [],
	isLoading: false,
	error: null,

	setSubjects: (subjects) => set({ subjects, error: null }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error, isLoading: false }),

	getSubject: (routeKey) => {
		return get().subjects.find((s) => s.routeKey === routeKey);
	},
}));

interface AppStore {
	isInitialized: boolean;
	setInitialized: (initialized: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
	isInitialized: false,
	setInitialized: (isInitialized) => set({ isInitialized }),
}));
