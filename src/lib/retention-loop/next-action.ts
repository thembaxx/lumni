import { offlineDB } from "@/lib/db/schema";
import { getCurrentSession } from "@/lib/exam-dates/types";

export type ActionKind =
	| "weakest-topic"
	| "exam-practice"
	| "due-cards"
	| "study-plan"
	| "flashcards";

export interface NextAction {
	kind: ActionKind;
	reason: string;
	ctaHref: string;
	ctaLabel: string;
	title: string;
	subject?: string;
	topic?: string;
	expiresAt: number;
}

const DISMISS_KEY = "lumni_next_action_dismiss";

function getDismissed(): Map<string, number> {
	try {
		const raw = localStorage.getItem(DISMISS_KEY);
		return raw ? new Map(JSON.parse(raw)) : new Map();
	} catch {
		return new Map();
	}
}

function setDismissed(kind: ActionKind, durationMs: number): void {
	try {
		const map = getDismissed();
		map.set(kind, Date.now() + durationMs);
		localStorage.setItem(DISMISS_KEY, JSON.stringify([...map]));
	} catch {
		/* silent */
	}
}

function isDismissed(kind: ActionKind): boolean {
	const map = getDismissed();
	const until = map.get(kind);
	return until != null && until > Date.now();
}

export function dismissAction(kind: ActionKind): void {
	setDismissed(kind, 24 * 60 * 60 * 1000);
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
	const h = new Date().getHours();
	if (h < 12) return "morning";
	if (h < 17) return "afternoon";
	return "evening";
}

export async function resolveNextAction(
	userId?: string,
): Promise<NextAction | null> {
	const tod = getTimeOfDay();

	const dueCount = await getDueCardCount();
	if (dueCount > 5 && !isDismissed("due-cards")) {
		return {
			kind: "due-cards",
			title: `${dueCount} flashcards due!`,
			reason: `You have ${dueCount} cards waiting — a quick review keeps your streak alive`,
			ctaHref: "/flashcards",
			ctaLabel: `Review ${dueCount} cards`,
			expiresAt: Date.now() + 3600000,
		};
	}

	const weakest = await getWeakestTopic(userId);
	if (weakest && !isDismissed("weakest-topic")) {
		const session = getCurrentSession();
		const daysUntil = session
			? getDaysUntilExam(session, weakest.subject)
			: null;
		const daysSuffix = daysUntil != null ? ` · ${daysUntil} days to exam` : "";
		return {
			kind: "weakest-topic",
			title: `Strengthen ${weakest.topic}`,
			reason: `${weakest.topic} in ${weakest.subject} is your weakest area at ${weakest.score}%${daysSuffix}`,
			ctaHref: `/quiz?subject=${encodeURIComponent(weakest.subject)}&topic=${encodeURIComponent(weakest.topic)}&count=10`,
			ctaLabel: tod === "morning" ? "Drill 10 questions" : "Practice now",
			subject: weakest.subject,
			topic: weakest.topic,
			expiresAt: Date.now() + 3600000,
		};
	}

	if (dueCount > 0 && !isDismissed("flashcards")) {
		return {
			kind: "flashcards",
			title: `${dueCount} flashcards due`,
			reason: "Quick card review — pick up where you left off",
			ctaHref: "/flashcards",
			ctaLabel: "Review cards",
			expiresAt: Date.now() + 3600000,
		};
	}

	if (tod === "evening" && !isDismissed("study-plan")) {
		return {
			kind: "study-plan",
			title: "Plan your next session",
			reason: "Evenings are great for planning tomorrow's study session",
			ctaHref: "/study-plan",
			ctaLabel: "Open study planner",
			expiresAt: Date.now() + 7200000,
		};
	}

	return null;
}

async function getDueCardCount(): Promise<number> {
	try {
		const now = Date.now();
		const cards = await offlineDB.flashcards
			.filter((c) => c.nextReview <= now)
			.toArray();
		return cards.length;
	} catch {
		return 0;
	}
}

async function getWeakestTopic(_userId?: string): Promise<{
	subject: string;
	topic: string;
	score: number;
} | null> {
	try {
		const competencies = await offlineDB.competencies.toArray();

		if (competencies.length === 0) return null;

		let weakest: { subjectId: string; topicId: string; score: number } | null =
			null;

		for (const c of competencies) {
			const score = typeof c.score === "number" ? c.score : 0;
			if (!weakest || score < weakest.score) {
				weakest = { subjectId: c.subjectId, topicId: c.topicId, score };
			}
		}

		if (!weakest) return null;

		const subjectName = await getSubjectName(weakest.subjectId);
		const topicName = await getTopicName(weakest.topicId);

		return {
			subject: subjectName,
			topic: topicName,
			score: weakest.score,
		};
	} catch {
		return null;
	}
}

async function getSubjectName(subjectId: string): Promise<string> {
	try {
		const subject = await offlineDB.subjects
			.where("code")
			.equals(subjectId)
			.first();
		return subject?.name ?? subjectId;
	} catch {
		return subjectId;
	}
}

async function getTopicName(topicId: string): Promise<string> {
	return topicId.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getDaysUntilExam(
	session: { year: number; session: string },
	subject: string,
): number | null {
	try {
		const slots = localStorage.getItem("lumni_exam_dates");
		if (!slots) return null;
		const parsed = JSON.parse(slots);
		const yearSlots = parsed?.[String(session.year)];
		if (!yearSlots) return null;
		const allSlots = Object.values(yearSlots).flat() as Array<
			Record<string, unknown>
		>;
		const subjectSlots = allSlots.find(
			(s) => String(s.subject).toLowerCase() === subject.toLowerCase(),
		) as { date: string } | undefined;
		if (!subjectSlots?.date) return null;
		const examDate = new Date(subjectSlots.date);
		const now = new Date();
		return Math.max(
			0,
			Math.ceil((examDate.getTime() - now.getTime()) / 86400000),
		);
	} catch {
		return null;
	}
}
