import { type NextRequest, NextResponse } from "next/server";
import {
	COLLECTIONS,
	createDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import type { StoredGamification } from "@/lib/gamification-engine/types";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function GET(_request: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const docs = await listDocuments<StoredGamification & { $id: string }>(
		COLLECTIONS.USER_GAMIFICATION,
		[`userId=${userId}`],
	);

	if (docs.length === 0) {
		return NextResponse.json({ gamification: null });
	}

	return NextResponse.json({ gamification: docs[0] });
}

export async function POST(request: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	try {
		const body = (await request.json()) as StoredGamification;

		const existing = await listDocuments<StoredGamification & { $id: string }>(
			COLLECTIONS.USER_GAMIFICATION,
			[`userId=${userId}`],
		);

		const now = new Date().toISOString();

		if (existing.length > 0) {
			const remote = docToGamification(
				existing[0] as unknown as Record<string, unknown>,
			);
			const merged: StoredGamification = {
				xp: Math.max(body.xp, remote.xp),
				totalXp: Math.max(body.totalXp, remote.totalXp),
				achievements: mergeAchievements(
					body.achievements ?? [],
					remote.achievements ?? [],
				),
				dailyChallenges: body.dailyChallenges ?? remote.dailyChallenges ?? [],
				streakMilestones: mergeMilestones(
					body.streakMilestones ?? [],
					remote.streakMilestones ?? [],
				),
				lastPracticeDate:
					body.lastPracticeDate ?? remote.lastPracticeDate ?? null,
				currentStreak: Math.max(
					body.currentStreak ?? 0,
					remote.currentStreak ?? 0,
				),
				totalQuestionsAnswered: Math.max(
					body.totalQuestionsAnswered ?? 0,
					remote.totalQuestionsAnswered ?? 0,
				),
			};
			await updateDocument(COLLECTIONS.USER_GAMIFICATION, remote.$id, {
				...merged,
				userId,
				updatedAt: now,
			} as unknown as Record<string, unknown>);
			return NextResponse.json({ gamification: merged });
		}

		const id = await createDocument(COLLECTIONS.USER_GAMIFICATION, {
			...body,
			userId,
			createdAt: now,
			updatedAt: now,
		});
		const created = await getDocument(COLLECTIONS.USER_GAMIFICATION, id);
		return NextResponse.json({ gamification: created }, { status: 201 });
	} catch {
		return NextResponse.json(
			{ error: "Invalid request body" },
			{ status: 400 },
		);
	}
}

function docToGamification(doc: Record<string, unknown>) {
	return {
		$id: doc.$id as string,
		xp: (doc.xp as number) ?? 0,
		totalXp: (doc.totalXp as number) ?? 0,
		achievements:
			(doc.achievements as { id: string; earnedAt: string }[]) ?? [],
		dailyChallenges: (doc.dailyChallenges as string[]) ?? [],
		streakMilestones:
			(doc.streakMilestones as {
				streak: number;
				reward: string;
				unlocked: boolean;
			}[]) ?? [],
		lastPracticeDate: (doc.lastPracticeDate as string | null) ?? null,
		currentStreak: (doc.currentStreak as number) ?? 0,
		totalQuestionsAnswered: (doc.totalQuestionsAnswered as number) ?? 0,
	};
}

function mergeAchievements(
	local: { id: string; earnedAt: string }[],
	remote: { id: string; earnedAt: string }[],
): { id: string; earnedAt: string }[] {
	const entries = new Map<string, string>();
	for (const a of [...local, ...remote]) {
		const existing = entries.get(a.id);
		if (!existing || a.earnedAt < existing) {
			entries.set(a.id, a.earnedAt);
		}
	}
	return Array.from(entries.entries()).map(([id, earnedAt]) => ({
		id,
		earnedAt,
	}));
}

function mergeMilestones(
	local: { streak: number; reward: string; unlocked: boolean }[],
	remote: { streak: number; reward: string; unlocked: boolean }[],
): { streak: number; reward: string; unlocked: boolean }[] {
	const map = new Map<number, { reward: string; unlocked: boolean }>();
	for (const m of [...local, ...remote]) {
		const existing = map.get(m.streak);
		if (!existing || m.unlocked) {
			map.set(m.streak, { reward: m.reward, unlocked: m.unlocked });
		}
	}
	return Array.from(map.entries()).map(([streak, val]) => ({
		streak,
		...val,
	}));
}
