"use server";

import { Query } from "appwrite";
import { randomUUID } from "crypto";
import { UTApi, UTFile } from "uploadthing/server";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	getDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import {
	getAuthenticatedUserId,
	requireAdmin,
	verifyAuth,
} from "@/lib/server/auth";

export async function fetchSubjects(userId: string) {
	await verifyAuth(userId);
	const targetUserId = userId;

	const subjects = await listDocuments(COLLECTIONS.SUBJECTS);

	const selectedUserSubjects = await listDocuments(COLLECTIONS.USER_SUBJECTS, [
		Query.equal("userId", targetUserId),
	]);

	const selectedIds = selectedUserSubjects.map(
		(us) => (us as Record<string, unknown>).subjectId as string,
	);

	return { subjects, selectedSubjectIds: selectedIds };
}

export async function fetchUserProgress(userId: string) {
	await verifyAuth(userId);
	const targetUserId = userId;

	const progressArr = await listDocuments(COLLECTIONS.USER_PROGRESS, [
		Query.equal("userId", targetUserId),
		Query.limit(1),
	]);

	const progress = progressArr[0] || null;

	const sessions = await listDocuments(COLLECTIONS.STUDY_SESSIONS, [
		Query.equal("userId", targetUserId),
	]);

	const totalAnswered = sessions.reduce(
		(sum: number, s) =>
			sum + ((s as Record<string, unknown>).questionsAnswered as number) || 0,
		0,
	);
	const totalCorrect = sessions.reduce(
		(sum: number, s) =>
			sum + ((s as Record<string, unknown>).correctCount as number) || 0,
		0,
	);
	const accuracy =
		totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;

	return {
		questionsAnswered: totalAnswered,
		accuracy,
		streak: progress
			? ((progress as Record<string, unknown>).currentStreak as number)
			: 0,
	};
}

export async function toggleUserSubject(userId: string, subjectId: string) {
	await verifyAuth(userId);
	const existing = await listDocuments(COLLECTIONS.USER_SUBJECTS, [
		Query.equal("userId", userId),
		Query.equal("subjectId", subjectId),
		Query.limit(1),
	]);

	if (existing.length > 0) {
		await deleteDocument(
			COLLECTIONS.USER_SUBJECTS,
			(existing[0] as Record<string, unknown>).$id as string,
		);
		return false;
	} else {
		await createDocument(COLLECTIONS.USER_SUBJECTS, {
			userId,
			subjectId,
		});
		return true;
	}
}

export async function adminUploadExamPaper(
	formData: FormData,
): Promise<{ success: boolean; url?: string; error?: string }> {
	await requireAdmin();
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

		await createDocument(COLLECTIONS.EXAM_PAPERS, {
			subjectId,
			year,
			paperNumber,
			type,
			fileUrl,
			fileKey,
			originalFileName: file.name,
		});

		if (type === "memo") {
			const questionPaper = await listDocuments(COLLECTIONS.EXAM_PAPERS, [
				Query.equal("subjectId", subjectId),
				Query.equal("year", year),
				Query.equal("paperNumber", paperNumber),
				Query.equal("type", "paper"),
				Query.limit(1),
			]);

			if (questionPaper.length > 0) {
				await updateDocument(
					COLLECTIONS.EXAM_PAPERS,
					(questionPaper[0] as Record<string, unknown>).$id as string,
					{
						memoId: id,
					},
				);
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

export async function getUserAccounts(_userId: string) {
	await requireAdmin();
	return [];
}
