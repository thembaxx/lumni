import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments } from "@/lib/db/client";

export interface StudentAssignment {
	id: string;
	teacherId: string;
	topics: string[];
	status: string;
	createdAt: string;
}

export const GET = createRouteHandler({
	auth: "required",
	errorLabel: "StudentAssignments",
	execute: async ({ userId }) => {
		const relationships = await listDocuments(COLLECTIONS.TEACHER_STUDENTS, [
			Query.equal("studentId", userId as string),
		]);

		if (relationships.length === 0) {
			return { assignments: [] };
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

		return { assignments };
	},
});
