import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import type { SearchResultItem } from "@/lib/services/search-service";

export const dynamic = "force-dynamic";

function textRelevant(text: string, query: string): boolean {
	const q = query.toLowerCase();
	return text.toLowerCase().includes(q);
}

export async function GET(request: Request) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json(
				{ error: "Authentication required", results: [] },
				{ status: 401 },
			);
		}

		const { searchParams } = new URL(request.url);
		const query = searchParams.get("query");
		if (!query || query.trim().length < 2) {
			return NextResponse.json({ results: [] });
		}

		const results: SearchResultItem[] = [];

		if (APPWRITE_DATABASE_ID) {
			try {
				const questionsRes = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.QUESTIONS,
					[Query.limit(25)],
				);
				for (const doc of questionsRes.documents) {
					const text = doc.questionText as string;
					if (textRelevant(text, query)) {
						results.push({
							id: `aw-q-${doc.$id}`,
							type: "question",
							title: text.slice(0, 120),
							snippet: text,
							subject: (doc.subject as string) || "",
							topic: (doc.topicId as string) || "",
							createdAt: new Date(doc.createdAt as string).getTime(),
						});
					}
				}
			} catch {
				// Questions collection may not exist or be accessible
			}

			try {
				const examSessionsRes = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.EXAM_SESSIONS,
					[Query.equal("userId", userId), Query.limit(25)],
				);
				for (const doc of examSessionsRes.documents) {
					const examPaperId = doc.examPaperId as string;
					if (textRelevant(examPaperId, query)) {
						results.push({
							id: `aw-es-${doc.$id}`,
							type: "exam-session",
							title: examPaperId,
							snippet: doc.completed ? "Completed" : "In progress",
							subject: "",
							createdAt: new Date(doc.createdAt as string).getTime(),
						});
					}
				}
			} catch {
				// Exam sessions collection may not exist
			}

			try {
				const wrongAnswersRes = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.WRONG_ANSWERS,
					[Query.equal("userId", userId), Query.limit(25)],
				);
				for (const doc of wrongAnswersRes.documents) {
					const questionText = doc.questionText as string;
					const correctAnswer = doc.correctAnswer as string;
					if (
						textRelevant(questionText, query) ||
						textRelevant(correctAnswer || "", query)
					) {
						results.push({
							id: `aw-wa-${doc.$id}`,
							type: "wrong-answer",
							title: questionText.slice(0, 120),
							snippet: `${(correctAnswer || "").slice(0, 100)}...`,
							subject: (doc.subject as string) || "",
							topic: (doc.topic as string) || "",
							createdAt: new Date(doc.createdAt as string).getTime(),
						});
					}
				}
			} catch {
				// Wrong answers collection may not exist
			}
		}

		return NextResponse.json({ results: results.slice(0, 25) });
	} catch (error) {
		console.error("[Appwrite Search API]", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Search failed",
				results: [],
			},
			{ status: 500 },
		);
	}
}
