import { create } from "zustand";
import { persist } from "zustand/middleware";
import { type DataAccess, dexieDataAccess } from "@/lib/db";
import type { ExamPaper, QuestionPart } from "@/types/exam-paper";
import type { ExamAnswer } from "@/types/exam-session";

let _deps: { db: DataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: DataAccess }) {
	_deps = deps;
}

interface ExamSessionState {
	paper: ExamPaper | null;
	paperId: string | null;
	sessionId: string | null;
	answers: Record<string, ExamAnswer>;
	flags: string[];
	currentPartId: string | null;
	timeRemaining: number;
	startedAt: number | null;
	completed: boolean;
	isSubmitting: boolean;

	initSession: (
		paper: ExamPaper,
		paperId: string,
		durationMinutes: number,
	) => void;
	setAnswer: (partId: string, value: string | string[]) => void;
	toggleFlag: (partId: string) => void;
	setCurrentPart: (partId: string) => void;
	tick: () => void;
	setSubmitting: (v: boolean) => void;
	completeSession: () => void;
	resetSession: () => void;

	getFlatParts: () => {
		sectionId: string;
		questionId: string;
		part: QuestionPart;
	}[];
	getAnsweredCount: () => number;
	getTotalPartsCount: () => number;
	getAnswer: (partId: string) => string | string[] | undefined;
	isFlagged: (partId: string) => boolean;
}

const EXAM_SESSION_STORAGE_KEY = "exam-session-storage";

// Dexie-backed storage adapter for zustand persist
interface PersistedState {
	paperId: string | null;
	sessionId: string | null;
	answers: Record<string, ExamAnswer>;
	flags: string[];
	currentPartId: string | null;
	timeRemaining: number;
	startedAt: number | null;
	completed: boolean;
}

const dexiePersistStorage = {
	getItem: async (name: string): Promise<{ state: PersistedState } | null> => {
		try {
			const record = await _deps.db.examSessions
				.where("paperId")
				.equals(name)
				.first();
			if (record) {
				return {
					state: {
						paperId: record.paperId,
						sessionId: null,
						answers: JSON.parse(record.answers || "{}") as Record<
							string,
							ExamAnswer
						>,
						flags: JSON.parse(record.flags || "[]") as string[],
						currentPartId: record.currentPartId,
						timeRemaining: record.timeRemaining,
						startedAt: record.startedAt,
						completed: record.completed,
					},
				};
			}
		} catch {
			// fall through
		}
		// Fallback to localStorage for backward compat
		if (typeof window !== "undefined") {
			const raw = localStorage.getItem(name);
			if (raw) {
				try {
					return JSON.parse(raw) as { state: PersistedState };
				} catch {
					// ignore
				}
			}
		}
		return null;
	},
	setItem: async (
		name: string,
		value: { state: PersistedState },
	): Promise<void> => {
		const state = value.state;
		if (state?.paperId) {
			try {
				await _deps.db.examSessions.put({
					paperId: state.paperId,
					answers: JSON.stringify(state.answers || {}),
					flags: JSON.stringify(state.flags || []),
					currentPartId: state.currentPartId || null,
					timeRemaining: state.timeRemaining || 0,
					startedAt: state.startedAt || Date.now(),
					lastSavedAt: Date.now(),
					completed: state.completed || false,
				});
			} catch {
				// ignore storage errors
			}
		}
		if (typeof window !== "undefined") {
			localStorage.setItem(name, JSON.stringify(value));
		}
	},
	removeItem: async (name: string): Promise<void> => {
		try {
			await _deps.db.examSessions.where("paperId").equals(name).delete();
			if (typeof window !== "undefined") {
				localStorage.removeItem(name);
			}
		} catch {
			// ignore
		}
	},
};

let cleanupCrossTabSync: (() => void) | null = null;

function setupCrossTabSync() {
	if (typeof window === "undefined") return;
	const handleStorage = (e: StorageEvent) => {
		if (e.key === EXAM_SESSION_STORAGE_KEY && e.newValue) {
			try {
				const parsed = JSON.parse(e.newValue);
				if (parsed?.state) {
					useExamSessionStore.setState(parsed.state);
				}
			} catch {
				console.warn("[ExamSession] Failed to parse cross-tab sync data");
			}
		}
	};
	window.addEventListener("storage", handleStorage);
	cleanupCrossTabSync = () =>
		window.removeEventListener("storage", handleStorage);
}

export function cleanupExamSessionSync() {
	cleanupCrossTabSync?.();
}

if (typeof window !== "undefined") {
	setupCrossTabSync();
}

export const useExamSessionStore = create<ExamSessionState>()(
	persist(
		(set, get) => ({
			paper: null,
			paperId: null,
			sessionId: null,
			answers: {},
			flags: [],
			currentPartId: null,
			timeRemaining: 0,
			startedAt: null,
			completed: false,
			isSubmitting: false,

			initSession: (paper, paperId, durationMinutes) => {
				const firstPart = getFirstPart(paper);
				set({
					paper,
					paperId,
					sessionId: crypto.randomUUID(),
					answers: {},
					flags: [],
					currentPartId: firstPart,
					timeRemaining: durationMinutes * 60,
					startedAt: Date.now(),
					completed: false,
					isSubmitting: false,
				});
			},

			setAnswer: (partId, value) => {
				const { answers } = get();
				set({
					answers: {
						...answers,
						[partId]: {
							value,
							answeredAt: new Date().toISOString(),
						},
					},
				});
			},

			toggleFlag: (partId) => {
				const { flags } = get();
				set({
					flags: flags.includes(partId)
						? flags.filter((f) => f !== partId)
						: [...flags, partId],
				});
			},

			setCurrentPart: (partId) => {
				set({ currentPartId: partId });
			},

			tick: () => {
				const { timeRemaining, completed } = get();
				if (!completed && timeRemaining > 0) {
					set({ timeRemaining: timeRemaining - 1 });
				}
			},

			setSubmitting: (v) => set({ isSubmitting: v }),

			completeSession: () => {
				set({ completed: true, isSubmitting: false });
			},

			resetSession: () => {
				set({
					paper: null,
					paperId: null,
					sessionId: null,
					answers: {},
					flags: [],
					currentPartId: null,
					timeRemaining: 0,
					startedAt: null,
					completed: false,
					isSubmitting: false,
				});
			},

			getFlatParts: () => {
				const { paper } = get();
				if (!paper) return [];
				const result: {
					sectionId: string;
					questionId: string;
					part: QuestionPart;
				}[] = [];
				for (const section of paper.sections) {
					for (const question of section.questions) {
						for (const part of question.parts) {
							result.push({
								sectionId: section.id,
								questionId: question.id,
								part,
							});
						}
					}
				}
				return result;
			},

			getAnsweredCount: () => {
				return Object.keys(get().answers).length;
			},

			getTotalPartsCount: () => {
				return get().getFlatParts().length;
			},

			getAnswer: (partId) => {
				return get().answers[partId]?.value;
			},

			isFlagged: (partId) => {
				return get().flags.includes(partId);
			},
		}),
		{
			name: EXAM_SESSION_STORAGE_KEY,
			storage: dexiePersistStorage,
			partialize: (state: ExamSessionState): PersistedState => ({
				paperId: state.paperId,
				sessionId: state.sessionId,
				answers: state.answers,
				flags: state.flags,
				timeRemaining: state.timeRemaining,
				currentPartId: state.currentPartId,
				startedAt: state.startedAt,
				completed: state.completed,
			}),
			onRehydrateStorage: () => (state) => {
				if (state && !validateHydratedState(state)) {
					state.resetSession();
				}
			},
		},
	),
);

function validateHydratedState(state: unknown): boolean {
	if (!state || typeof state !== "object") return false;
	const s = state as Record<string, unknown>;
	return (
		typeof s.paperId === "string" ||
		s.paperId === null ||
		s.paperId === undefined
	);
}

function getFirstPart(paper: ExamPaper): string | null {
	for (const section of paper.sections) {
		for (const question of section.questions) {
			if (question.parts.length > 0) {
				return `${section.id}-${question.id}-${question.parts[0].id}`;
			}
		}
	}
	return null;
}
