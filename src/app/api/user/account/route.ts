import { Query, Users } from "node-appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { serverClient } from "@/lib/appwrite.server";
import { COLLECTIONS, deleteDocument, listDocuments } from "@/lib/db/client";
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

export const DELETE = createRouteHandler({
  auth: "required",
  errorLabel: "Account",
  execute: async ({ userId }) => {
    await Promise.all(
      USER_DATA_COLLECTIONS.map(async (collection) => {
        try {
          const docs = await listDocuments<Record<string, unknown>>(collection, [
            Query.equal("userId", userId as string),
          ]);
          await Promise.all(docs.map((doc) => deleteDocument(collection, doc.$id as string)));
        } catch {
          // collection may not exist, skip
        }
      }),
    );

    await userConsentService.delete(userId as string);

    const users = new Users(serverClient);
    await users.delete(userId as string);

    return { success: true };
  },
});
