import { logError } from "@/lib/shared/logger";
import {
	COLLECTIONS,
	createDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import type { ServiceResult } from "@/lib/services";
import { failure, success } from "@/lib/services";
import type {
	GroupBadge,
	GroupChallenge,
	GroupChallengeEntry,
} from "./challenge-types";
import { BADGE_DEFS, getWeekRange } from "./challenge-types";

function computeCombinedScore(
	xpEarned: number,
	questionsAnswered: number,
	accuracy: number,
	groupTotalXp: number,
	groupTotalQuestions: number,
): number {
	const xpScore = (xpEarned / Math.max(1, groupTotalXp)) * 50;
	const questionScore =
		(questionsAnswered / Math.max(1, groupTotalQuestions)) * 30;
	const accuracyScore = (accuracy / 100) * 20;
	return Math.round((xpScore + questionScore + accuracyScore) * 100) / 100;
}

export async function getOrCreateChallenge(
	groupId: string,
): Promise<ServiceResult<GroupChallenge>> {
	try {
		const { start, end } = getWeekRange();

		const existing = await listDocuments<GroupChallenge>(
			COLLECTIONS.GROUP_CHALLENGES,
			[`groupId=${groupId}`, `status=active`],
		);

		const activeChallenge = existing.find(
			(c) => c.weekStart <= end && c.weekEnd >= start,
		);
		if (activeChallenge) return success(activeChallenge);

		await Promise.all(
			existing.flatMap((past) =>
				past.weekEnd < new Date().toISOString() && past.status === "active"
					? [closeChallenge(past.$id)]
					: [],
			),
		);

		const now = new Date().toISOString();
		const challengeId = await createDocument(COLLECTIONS.GROUP_CHALLENGES, {
			groupId,
			weekStart: start,
			weekEnd: end,
			status: "active",
			createdAt: now,
		});

		const challenge = await getDocument<GroupChallenge>(
			COLLECTIONS.GROUP_CHALLENGES,
			challengeId,
		);
		if (!challenge) return failure("Failed to create challenge");
		return success(challenge);
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to get challenge",
		);
	}
}

export async function getChallengeEntries(
	challengeId: string,
): Promise<ServiceResult<GroupChallengeEntry[]>> {
	try {
		const entries = await listDocuments<GroupChallengeEntry>(
			COLLECTIONS.GROUP_CHALLENGE_ENTRIES,
			[`challengeId=${challengeId}`],
		);
		return success(entries);
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to get entries",
		);
	}
}

export async function updateChallengeEntry(
	userId: string,
	xpGained: number,
	questionsCount: number,
	accuracy: number,
): Promise<void> {
	try {
		const memberships = await listDocuments<Record<string, unknown>>(
			COLLECTIONS.GROUP_MEMBERS,
			[`userId=${userId}`],
		);

		await Promise.all(
			memberships.map(async (membership) => {
				const groupId = membership.groupId as string;
				const challengeResult = await getOrCreateChallenge(groupId);
				if (!challengeResult.success) return;
				const challenge = challengeResult.data;
				if (challenge.status !== "active") return;

				const [existing, allEntries] = await Promise.all([
					listDocuments<GroupChallengeEntry>(
						COLLECTIONS.GROUP_CHALLENGE_ENTRIES,
						[`challengeId=${challenge.$id}`, `userId=${userId}`],
					),
					listDocuments<GroupChallengeEntry>(
						COLLECTIONS.GROUP_CHALLENGE_ENTRIES,
						[`challengeId=${challenge.$id}`],
					),
				]);
				const groupTotalXp =
					allEntries.reduce((s, e) => s + e.xpEarned, 0) + xpGained;
				const groupTotalQ =
					allEntries.reduce((s, e) => s + e.questionsAnswered, 0) +
					questionsCount;

				if (existing.length > 0) {
					const entry = existing[0];
					const newXp = entry.xpEarned + xpGained;
					const newQ = entry.questionsAnswered + questionsCount;
					const combined = computeCombinedScore(
						newXp,
						newQ,
						accuracy,
						groupTotalXp,
						groupTotalQ,
					);
					await updateDocument(COLLECTIONS.GROUP_CHALLENGE_ENTRIES, entry.$id, {
						xpEarned: newXp,
						questionsAnswered: newQ,
						accuracy,
						combinedScore: combined,
						updatedAt: new Date().toISOString(),
					});
				} else {
					const combined = computeCombinedScore(
						xpGained,
						questionsCount,
						accuracy,
						groupTotalXp,
						groupTotalQ,
					);
					await createDocument(COLLECTIONS.GROUP_CHALLENGE_ENTRIES, {
						challengeId: challenge.$id,
						groupId,
						userId,
						xpEarned: xpGained,
						questionsAnswered: questionsCount,
						accuracy,
						combinedScore: combined,
						updatedAt: new Date().toISOString(),
					});
				}
			}),
		);
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		// Silently fail - challenge tracking is non-critical
	}
}

async function closeChallenge(challengeId: string): Promise<void> {
	try {
		const entries = await listDocuments<GroupChallengeEntry>(
			COLLECTIONS.GROUP_CHALLENGE_ENTRIES,
			[`challengeId=${challengeId}`],
		);

		const ranked = entries.toSorted(
			(a, b) => b.combinedScore - a.combinedScore,
		);

		await Promise.all(
			ranked.slice(0, 3).map((entry, i) => {
				const badge = BADGE_DEFS[i];
				return createDocument(COLLECTIONS.GROUP_BADGES, {
					groupId: entry.groupId,
					userId: entry.userId,
					name: badge.name,
					description: badge.description,
					icon: badge.icon,
					tier: badge.tier,
					earnedAt: new Date().toISOString(),
				});
			}),
		);

		await updateDocument(COLLECTIONS.GROUP_CHALLENGES, challengeId, {
			status: "completed",
		});
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		// Silently fail
	}
}

export async function getGroupBadges(
	groupId: string,
): Promise<ServiceResult<GroupBadge[]>> {
	try {
		const badges = await listDocuments<GroupBadge>(COLLECTIONS.GROUP_BADGES, [
			`groupId=${groupId}`,
		]);
		return success(badges);
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		return failure(err instanceof Error ? err.message : "Failed to get badges");
	}
}

export async function getInterGroupLeaderboard(): Promise<
	ServiceResult<
		{
			groupId: string;
			groupName: string;
			totalScore: number;
			memberCount: number;
		}[]
	>
> {
	try {
		const { start } = getWeekRange();
		const challenges = await listDocuments<GroupChallenge>(
			COLLECTIONS.GROUP_CHALLENGES,
			[`weekStart=${start}`, `status=active`],
		);

		const leaderboard: {
			groupId: string;
			groupName: string;
			totalScore: number;
			memberCount: number;
		}[] = [];

		const leaderboardEntries = await Promise.all(
			challenges.map(async (challenge) => {
				const [entries, group] = await Promise.all([
					listDocuments<GroupChallengeEntry>(
						COLLECTIONS.GROUP_CHALLENGE_ENTRIES,
						[`challengeId=${challenge.$id}`],
					),
					getDocument<{ name: string; memberCount: number }>(
						COLLECTIONS.STUDY_GROUPS,
						challenge.groupId,
					),
				]);

				const totalScore = entries.reduce((s, e) => s + e.combinedScore, 0);

				return {
					groupId: challenge.groupId,
					groupName: group?.name || "Unknown Group",
					totalScore: Math.round(totalScore * 100) / 100,
					memberCount: group?.memberCount || entries.length,
				};
			}),
		);
		leaderboard.push(...leaderboardEntries);

		leaderboard.sort((a, b) => b.totalScore - a.totalScore);
		return success(leaderboard);
	} catch (err) {
		logError("StudyGroupsChallengeService", err);
		return failure(
			err instanceof Error ? err.message : "Failed to get leaderboard",
		);
	}
}
