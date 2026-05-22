import { offlineDB } from "@/lib/db/schema";
import { EXAM_SLOTS_2026_MAY } from "./data-2026-may";
import type { ExamSlot } from "./types";

const SEED_DATA: Record<string, ExamSlot[]> = {
	"may-june_2026": EXAM_SLOTS_2026_MAY,
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
		const cached = await offlineDB.examDates
			.where("cacheKey")
			.equals(key)
			.first();
		if (cached) {
			const slots: ExamSlot[] = JSON.parse(cached.slots);
			return slots;
		}
	} catch {}

	const slots = getSeedData(session, year);
	if (slots.length > 0) {
		try {
			await offlineDB.examDates.put({
				cacheKey: key,
				session,
				year,
				slots: JSON.stringify(slots),
				updatedAt: Date.now(),
			});
		} catch {}
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

const subjectColors: Record<string, string> = {
	mathematics: "bg-[--system-accent]",
	"physical-sciences": "bg-success",
	"life-sciences": "bg-accent",
	"english-home-language": "bg-warning",
	"afrikaans-home-language": "bg-destructive",
	geography: "bg-info",
	history: "bg-warning",
	accounting: "bg-warning-foreground",
	"business-studies": "bg-accent",
	economics: "bg-info",
	"mathematical-literacy": "bg-[--chart-3]",
	"computer-applications-technology": "bg-[--chart-4]",
	"information-technology": "bg-[--chart-5]",
};

const subjectAbbrs: Record<string, string> = {
	mathematics: "Math",
	"physical-sciences": "PhySci",
	"life-sciences": "LifeSci",
	"english-home-language": "EngHL",
	"english-first-additional-language": "EngFAL",
	"afrikaans-home-language": "AfrHL",
	"afrikaans-first-additional-language": "AfrFAL",
	geography: "Geo",
	history: "Hist",
	accounting: "Acc",
	"business-studies": "Bus",
	economics: "Econ",
	"mathematical-literacy": "MathLit",
	"computer-applications-technology": "CAT",
	"information-technology": "IT",
};

export function getSubjectColor(subjectId: string): string {
	return subjectColors[subjectId] || "bg-muted";
}

export function getSubjectAbbr(subjectId: string): string {
	return subjectAbbrs[subjectId] || subjectId.slice(0, 4).toUpperCase();
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
