import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";
import { getAuthenticatedUserId } from "@/lib/server/auth";

export interface StudentAssignment {
	id: string;
	teacherId: string;
	topics: string[];
	status: string;
	createdAt: string;
}

export async function GET() {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	try {
		const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
			Query.equal("studentId", userId),
		]);

		if (relationships.length === 0) {
			return NextResponse.json({ assignments: [] });
		}

		const teacherIds = [
			...new Set(
				relationships.map(
					(r) => (r as Record<string, unknown>).teacherId as string,
				),
			),
		];

		const assignmentResults = await Promise.all(
			teacherIds.map((tid) =>
				listDocuments(COLLECTIONS.TEACHER_ASSIGNMENTS, [
					Query.equal("teacherId", tid),
					Query.orderDesc("createdAt"),
				]),
			),
		);

		const allAssignments = assignmentResults.flat();

		const topicIds = [
			...new Set(
				allAssignments.flatMap((a) => {
					const raw = (a as Record<string, unknown>).topicIds as string;
					try {
						return JSON.parse(raw) as string[];
					} catch {
						return [];
					}
				}),
			),
		];

		const topicDocs =
			topicIds.length > 0
				? await listDocuments(COLLECTIONS.TOPICS, [
						Query.equal("$id", topicIds),
					])
				: [];

		const topicMap = new Map(
			topicDocs.map((t) => {
				const doc = t as Record<string, unknown>;
				return [doc.$id as string, doc.name as string];
			}),
		);

		const assignments: StudentAssignment[] = allAssignments.map((a) => {
			const doc = a as Record<string, unknown>;
			const raw = (doc.topicIds as string) || "[]";
			let parsed: string[] = [];
			try {
				parsed = JSON.parse(raw) as string[];
			} catch {
				parsed = [];
			}
			return {
				id: doc.$id as string,
				teacherId: doc.teacherId as string,
				topics: parsed.map((tId) => topicMap.get(tId) || tId),
				status: (doc.status as string) || "pending",
				createdAt: (doc.createdAt as string) || "",
			};
		});

		assignments.sort(
			(a, b) =>
				new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
		);

		return NextResponse.json({ assignments });
	} catch (error) {
		console.error("[student/assignments] Error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch assignments" },
			{ status: 500 },
		);
	}
}
