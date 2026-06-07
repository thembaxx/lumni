import { competencyService } from "@/lib/competency-engine/competency-service";
import { dexieDataAccess, type SyncDataAccess } from "@/lib/db";
import { logError } from "@/lib/shared/logger";

let _deps: { db: SyncDataAccess } = { db: dexieDataAccess };
export function __setDepsForTesting(deps: { db: SyncDataAccess }) {
	_deps = deps;
}

let cachedContext: string | null = null;
let contextLoadedAt = 0;
const CACHE_TTL = 5 * 60 * 1000;

const KNOWN_SUBJECTS = [
	"mathematics",
	"physical-sciences",
	"english",
	"accounting",
	"life-sciences",
	"geography",
	"history",
	"business-studies",
	"economics",
] as const;

export async function buildChatContext(): Promise<string> {
	const now = Date.now();
	if (cachedContext && now - contextLoadedAt < CACHE_TTL) return cachedContext;

	const parts: string[] = [];

	const summaries = await Promise.allSettled(
		KNOWN_SUBJECTS.map(async (id) => {
			const summary = await competencyService.getMasterySummary(id);
			return { id, ...summary };
		}),
	);

	const weak: string[] = [];
	const strong: string[] = [];
	for (const result of summaries) {
		if (result.status === "fulfilled" && result.value.total > 0) {
			const s = result.value;
			if (s.averageScore < 40) weak.push(formatSubject(s.id, s.averageScore));
			else if (s.averageScore >= 65)
				strong.push(formatSubject(s.id, s.averageScore));
		}
	}

	if (weak.length > 0) parts.push(`Weak areas: ${weak.join(", ")}.`);
	if (strong.length > 0) parts.push(`Strong areas: ${strong.join(", ")}.`);

	try {
		const recent = await _deps.db.wrongAnswers
			.orderBy("createdAt")
			.reverse()
			.limit(5)
			.toArray();

		if (recent.length > 0) {
			const mistakes = recent
				.map(
					(w) =>
						`  - ${w.subject}/${w.topic}: ${truncate(w.questionText, 100)}`,
				)
				.join("\n");
			parts.push(`Recent mistakes to address:\n${mistakes}`);
		}
	} catch (err) {
		logError("BuildChatContext", err);
	}

	cachedContext = parts.length > 0 ? parts.join("\n") : "";
	contextLoadedAt = now;
	return cachedContext;
}

export function clearChatContextCache(): void {
	cachedContext = null;
	contextLoadedAt = 0;
}

function formatSubject(id: string, score: number): string {
	return `${id} (${Math.round(score)}%)`;
}

function truncate(text: string, max: number): string {
	return text.length > max ? `${text.slice(0, max)}…` : text;
}
