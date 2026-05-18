import { create } from "zustand";

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

let appInitialized = false;
const initListeners = new Set<(v: boolean) => void>();

export function setAppInitialized(v: boolean) {
	appInitialized = v;
	for (const fn of initListeners) fn(v);
}

export function isAppInitialized(): boolean {
	return appInitialized;
}

export function onAppInit(fn: (v: boolean) => void) {
	initListeners.add(fn);
	return () => initListeners.delete(fn);
}
