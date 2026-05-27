import { Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import type { PastPaperQuestion } from "@/lib/exam-paper-ingestion/past-paper-question-types";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export async function GET(request: NextRequest) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const { searchParams } = new URL(request.url);
		const subject = searchParams.get("subject");
		const topic = searchParams.get("topic");
		const type = searchParams.get("type");
		const limit = Math.min(parseInt(searchParams.get("limit") || "10", 10), 50);

		const filters: string[] = [];
		if (subject) filters.push(Query.equal("subject", subject));
		if (type) filters.push(Query.equal("questionType", type));

		const docs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.PAST_PAPER_QUESTIONS,
			[...filters, Query.limit(limit), Query.orderDesc("year")],
		);

		let questions = docs.documents.map((d) => {
			const {
				userId: _u,
				$id,
				$collectionId,
				$createdAt,
				$updatedAt,
				$permissions,
				$databaseId,
				...rest
			} = d;
			return rest as unknown as PastPaperQuestion;
		});

		if (topic) {
			const topicLower = topic.toLowerCase();
			questions = questions.filter(
				(q) =>
					q.questionText.toLowerCase().includes(topicLower) ||
					q.topic?.toLowerCase().includes(topicLower),
			);
		}

		return NextResponse.json({ questions });
	} catch (error) {
		console.error("Past paper questions fetch error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch questions" },
			{ status: 500 },
		);
	}
}
