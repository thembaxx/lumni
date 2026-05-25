import { type NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import { COLLECTIONS, createDocument, getDocument, listDocuments, updateDocument } from "@/lib/db/client";
import type { StoredGamification } from "@/lib/gamification-engine/types";

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
			const doc = existing[0];
			const merged: StoredGamification = {
				xp: Math.max(body.xp, (doc as any).xp ?? 0),
				totalXp: Math.max(body.totalXp, (doc as any).totalXp ?? 0),
				achievements: mergeAchievements(
					(body as any).achievements ?? [],
					(doc as any).achievements ?? [],
				),
				dailyChallenges: body.dailyChallenges ?? (doc as any).dailyChallenges ?? [],
				streakMilestones: mergeMilestones(
					(body as any).streakMilestones ?? [],
					(doc as any).streakMilestones ?? [],
				),
				lastPracticeDate:
					(body as any).lastPracticeDate ?? (doc as any).lastPracticeDate ?? null,
				currentStreak: Math.max(
					(body as any).currentStreak ?? 0,
					(doc as any).currentStreak ?? 0,
				),
				totalQuestionsAnswered: Math.max(
					(body as any).totalQuestionsAnswered ?? 0,
					(doc as any).totalQuestionsAnswered ?? 0,
				),
			};
			await updateDocument(COLLECTIONS.USER_GAMIFICATION, doc.$id, {
				...merged,
				userId,
				updatedAt: now,
			});
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
		return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
	}
}

function mergeAchievements(
	local: { id: string; earnedAt: string }[],
	remote: { id: string; earnedAt: string }[],
): { id: string; earnedAt: string }[] {
	const map = new Map<string, string>();
	for (const a of [...local, ...remote]) {
		if (!map.has(a.id) || a.earnedAt < map.get(a.id)!) {
			map.set(a.id, a.earnedAt);
		}
	}
	return Array.from(map.entries()).map(([id, earnedAt]) => ({ id, earnedAt }));
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
