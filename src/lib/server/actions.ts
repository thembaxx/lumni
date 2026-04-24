"use server";

import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import { UTApi, UTFile } from "uploadthing/server";
import { getDb } from "@/lib/db/client";
import {
	examPaper,
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

export async function adminUploadExamPaper(
	formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		const file = formData.get("file") as File | null;
		const subjectId = formData.get("subjectId") as string;
		const year = parseInt(formData.get("year") as string, 10);
		const paperNumber = parseInt(formData.get("paperNumber") as string, 10);
		const type = formData.get("type") as "paper" | "memo";

		if (!file || !subjectId || !year || !paperNumber || !type) {
			return { success: false, error: "Missing required fields" };
		}

		const bytes = await file.arrayBuffer();
		const buffer = Buffer.from(bytes);
		const utFile = new UTFile([buffer], file.name);

		const utapi = new UTApi();
		const result = await utapi.uploadFiles(utFile);

		if (!result?.data) {
			return {
				success: false,
				error: result?.error?.message || "Upload failed",
			};
		}

		const fileUrl = result.data.ufsUrl || result.data.url;
		const fileKey = result.data.key;
		const id = randomUUID();

		const db = getDb();
		await db.insert(examPaper).values({
			id,
			subjectId,
			year,
			paperNumber,
			type,
			fileUrl,
			fileKey,
			originalFileName: file.name,
		});

		if (type === "memo") {
			const questionPaper = await db
				.select()
				.from(examPaper)
				.where(
					and(
						eq(examPaper.subjectId, subjectId),
						eq(examPaper.year, year),
						eq(examPaper.paperNumber, paperNumber),
						eq(examPaper.type, "paper"),
					),
				)
				.limit(1);

			if (questionPaper.length > 0) {
				await db
					.update(examPaper)
					.set({ memoId: questionPaper[0].id })
					.where(eq(examPaper.id, id));
			}
		}

		return { success: true, url: fileUrl };
	} catch (error) {
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		};
	}
}
