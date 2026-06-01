import type { BloomLevel, QuestionType } from "@/lib/question-engine/types";

export interface GradeEvent {
	questionId: string;
	questionText: string;
	subject: string;
	topic: string;
	bloomLevel: BloomLevel;
	questionType: QuestionType;
	score: number;
	maxScore: number;
	correct: boolean;
	correctAnswer: string;
	userAnswer: string;
	explanation: string;
}

export type GradeEventSubscriber = (event: GradeEvent) => void | Promise<void>;

export class GradeEventBus {
	private subscribers = new Set<GradeEventSubscriber>();

	on(fn: GradeEventSubscriber): () => void {
		this.subscribers.add(fn);
		return () => this.subscribers.delete(fn);
	}

	off(fn: GradeEventSubscriber): void {
		this.subscribers.delete(fn);
	}

	async emit(event: GradeEvent): Promise<void> {
		await Promise.allSettled([...this.subscribers].map((fn) => fn(event)));
	}
}

export const gradeEventBus = new GradeEventBus();
