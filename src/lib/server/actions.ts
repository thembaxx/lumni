"use server";

import { and, eq } from "drizzle-orm";
import { getDb } from "@/lib/db/client";
import {
	studySession,
	subject,
	user,
	userProgress,
	userSubject,
} from "@/lib/db/schema";

const DEFAULT_USER_ID = "demo-user";

async function ensureDemoUser() {
	const db = getDb();

	const existingUser = await db
		.select()
		.from(user)
		.where(eq(user.id, DEFAULT_USER_ID))
		.limit(1);

	if (existingUser.length === 0) {
		await db.insert(user).values({
			id: DEFAULT_USER_ID,
			name: "Demo User",
			email: "demo@lumni.ai",
			emailVerified: true,
		});
	}

	return DEFAULT_USER_ID;
}

export async function fetchSubjects(userId?: string) {
	const db = getDb();
	const targetUserId = userId || (await ensureDemoUser());

	const subjects = await db.select().from(subject);

	const selectedUserSubjects = await db
		.select()
		.from(userSubject)
		.where(eq(userSubject.userId, targetUserId));

	const selectedIds = selectedUserSubjects.map((us) => us.subjectId);

	return { subjects, selectedSubjectIds: selectedIds };
}

export async function fetchUserProgress(userId?: string) {
	const db = getDb();
	const targetUserId = userId || (await ensureDemoUser());

	const progressArr = await db
		.select()
		.from(userProgress)
		.where(eq(userProgress.userId, targetUserId))
		.limit(1);

	const progress = progressArr[0] || null;

	const sessions = await db
		.select()
		.from(studySession)
		.where(eq(studySession.userId, targetUserId));

	const totalAnswered = sessions.reduce(
		(sum, s) => sum + (s.questionsAnswered || 0),
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum, s) => sum + (s.correctCount || 0),
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return {
		questionsAnswered: totalAnswered,
		accuracy,
		streak: progress?.currentStreak ?? 0,
	};
}

export async function toggleUserSubject(userId: string, subjectId: string) {
	const db = getDb();

	const existing = await db
		.select()
		.from(userSubject)
		.where(
			and(eq(userSubject.userId, userId), eq(userSubject.subjectId, subjectId)),
		)
		.then((res) => res[0]);

	if (existing) {
		await db
			.delete(userSubject)
			.where(
				and(
					eq(userSubject.userId, userId),
					eq(userSubject.subjectId, subjectId),
				),
			);
		return false;
	} else {
		await db.insert(userSubject).values({
			id: `${userId}-${subjectId}`,
			userId,
			subjectId,
		});
		return true;
	}
}
