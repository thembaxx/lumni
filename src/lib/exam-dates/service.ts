import { dexieDataAccess } from "@/lib/db";
import type { StudyDataAccess } from "@/lib/db/data-access";
import { EXAM_SLOTS_2026_MAY } from "./data-2026-may";
import { EXAM_SLOTS_2026_NOV } from "./data-2026-nov";
import { EXAM_SLOTS_2027_MAY } from "./data-2027-may";
import { getSubjectAbbr, getSubjectColor } from "./subject-maps";
import type { ExamSlot } from "./types";

const DEFAULT_DEPS = { db: dexieDataAccess };
let _deps: { db: StudyDataAccess } = DEFAULT_DEPS;

export function __setDepsForTesting(deps: { db: StudyDataAccess }) {
	_deps = deps;
}

export { getSubjectAbbr, getSubjectColor };

const SEED_DATA: Record<string, ExamSlot[]> = {
	"may-june_2026": EXAM_SLOTS_2026_MAY,
	"oct-nov_2026": EXAM_SLOTS_2026_NOV,
	"may-june_2027": EXAM_SLOTS_2027_MAY,
};

export function getSeedData(session: string, year: number): ExamSlot[] {
	return SEED_DATA[`${session}_${year}`] ?? [];
}

function getSessionKey(session: string, year: number) {
	return `${session}_${year}`;
}

export async function getExamDates(
	session: string,
	year: number,
): Promise<ExamSlot[]> {
	const key = getSessionKey(session, year);

	try {
		const cached = await _deps.db.examDates
			.where("cacheKey")
			.equals(key)
			.first();
		if (cached) {
			const slots: ExamSlot[] = JSON.parse(cached.slots);
			return slots;
		}
	} catch (e) {
		console.warn("[ExamDates] Failed to read cache", e);
	}

	const slots = getSeedData(session, year);
	if (slots.length > 0) {
		try {
			await _deps.db.examDates.put({
				cacheKey: key,
				session,
				year,
				slots: JSON.stringify(slots),
				updatedAt: Date.now(),
			});
		} catch (e) {
			console.warn("[ExamDates] Failed to write cache", e);
		}
	}

	return slots;
}

export async function getNextExams(
	session: string,
	year: number,
	count = 2,
): Promise<ExamSlot[]> {
	const all = await getExamDates(session, year);
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	return all
		.filter((s) => new Date(s.date) >= now)
		.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
		.slice(0, count);
}

export async function getExamsGroupedByDate(
	session: string,
	year: number,
): Promise<{ date: string; slots: ExamSlot[] }[]> {
	const all = await getExamDates(session, year);
	const grouped: Record<string, ExamSlot[]> = {};
	for (const slot of all) {
		if (!grouped[slot.date]) grouped[slot.date] = [];
		grouped[slot.date].push(slot);
	}
	return Object.entries(grouped)
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([date, slots]) => ({ date, slots }));
}

export function getSessionLabel(session: string, year: number): string {
	if (session === "may-june") return `May/June ${year}`;
	return `Oct/Nov ${year}`;
}

export function formatFriendlyDate(dateStr: string): string {
	const d = new Date(`${dateStr}T00:00:00`);
	return d.toLocaleDateString("en-ZA", {
		weekday: "short",
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function formatTimeRange(start: string, end: string): string {
	return `${start}–${end}`;
}

export function formatDuration(hours: number): string {
	if (hours === 1) return "1 hour";
	if (hours === 1.5) return "1h 30m";
	if (hours === 2) return "2 hours";
	if (hours === 2.5) return "2h 30m";
	if (hours === 3) return "3 hours";
	return `${hours}h`;
}

export function refreshExamDatesFromAppwrite(
	session: string,
	year: number,
): Promise<ExamSlot[]> {
	return getExamDates(session, year);
}

export async function syncExamDatesToAppwrite(
	session: string,
	year: number,
	slots: ExamSlot[],
): Promise<void> {
	try {
		const { enqueue } = await import("@/lib/orchestrator/job-queue");
		const key = `${session}_${year}`;
		await enqueue("appwrite-exam-dates-sync", {
			cacheKey: key,
			session,
			year,
			slots: JSON.stringify(slots),
			source: "seed",
		});
	} catch (err) {
		console.warn("[exam-dates] Failed to enqueue sync:", err);
	}
}

export async function syncExamDatesDirect(
	session: string,
	year: number,
	slots: ExamSlot[],
): Promise<void> {
	try {
		const { upsertDocument } = await import(
			"@/lib/orchestrator/handlers/sync-factory"
		);
		const key = `${session}_${year}`;
		const { Query } = await import("appwrite");
		await upsertDocument("exam_dates", [Query.equal("cacheKey", key)], {
			cacheKey: key,
			session,
			year,
			slots: JSON.stringify(slots),
			source: "seed",
		});
	} catch (err) {
		console.warn("[exam-dates] Direct sync failed:", err);
	}
}
