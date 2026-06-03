import { Query } from "appwrite";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { COLLECTIONS, listDocuments, updateDocument } from "@/lib/db/client";

export const POST = createRouteHandler({
	auth: "required",
	errorLabel: "AssignmentComment",
	validate: (body) => {
		if (!body.comment) return "comment required";
		if (!body.studentId) return "studentId required";
		return null;
	},
	execute: async ({ userId, body, params }) => {
		const assignmentId = params?.id as string;
		const { comment, studentId } = body as {
			comment: string;
			studentId: string;
		};

		const assignment = await listDocuments(COLLECTIONS.TEACHER_ASSIGNMENTS, [
			Query.equal("$id", assignmentId),
			Query.equal("teacherId", userId as string),
		]);

		if (assignment.length === 0) {
			return { success: false, error: "Assignment not found or unauthorized" };
		}

		const submissions = await listDocuments(
			COLLECTIONS.ASSIGNMENT_SUBMISSIONS,
			[
				Query.equal("assignmentId", assignmentId),
				Query.equal("studentId", studentId),
			],
		);

		if (submissions.length === 0) {
			return { success: false, error: "Submission not found" };
		}

		const subId = (submissions[0] as Record<string, unknown>).$id as string;
		await updateDocument(COLLECTIONS.ASSIGNMENT_SUBMISSIONS, subId, {
			teacherComment: comment,
		});

		return { success: true };
	},
});
