import { NextResponse } from "next/server";
import { Query, Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite";
import { COLLECTIONS, deleteDocument, listDocuments } from "@/lib/db/client";
import { auth } from "@/lib/server/auth";
import { userConsentService } from "@/lib/services/user-consent-service";

const USER_DATA_COLLECTIONS = [
	COLLECTIONS.USER_SUBJECTS,
	COLLECTIONS.USER_PROGRESS,
	COLLECTIONS.STUDY_SESSIONS,
	COLLECTIONS.COMPETENCIES,
	COLLECTIONS.EXAM_SESSIONS,
	COLLECTIONS.REFERRAL_CODES,
	COLLECTIONS.REFERRALS,
	COLLECTIONS.STUDY_PLANS,
	COLLECTIONS.QUESTION_FLAGS,
	COLLECTIONS.ANALYTICS,
	COLLECTIONS.FLASHCARDS,
	COLLECTIONS.WRONG_ANSWERS,
	COLLECTIONS.CHAT_MESSAGES,
	COLLECTIONS.TEACHER_STUDENTS,
	COLLECTIONS.TEACHER_ASSIGNMENTS,
	COLLECTIONS.PARENT_STUDENTS,
	COLLECTIONS.FLASHCARD_REVIEWS,
	COLLECTIONS.BOOKMARKS,
	COLLECTIONS.NOTES,
	COLLECTIONS.USER_GAMIFICATION,
	COLLECTIONS.USER_CONSENTS,
];

export async function DELETE() {
	try {
		const userId = await auth();

		for (const collection of USER_DATA_COLLECTIONS) {
			try {
				const docs = await listDocuments<Record<string, unknown>>(collection, [
					Query.equal("userId", userId),
				]);
				await Promise.all(
					docs.map((doc) => deleteDocument(collection, doc.$id as string)),
				);
			} catch {
				// collection may not exist, skip
			}
		}

		await userConsentService.delete(userId);

		const users = new Users(serverClient);
		await users.delete(userId);

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[account/delete] Failed:", error);
		return NextResponse.json(
			{ error: "Failed to delete account" },
			{ status: 500 },
		);
	}
}
