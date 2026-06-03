import { NextResponse } from "next/server";
import { shareAssignment } from "@/lib/share/share-service";

export async function POST(request: Request) {
	try {
		const { assignmentId, topic, questionCount, dueDate } =
			await request.json();
		if (!assignmentId || !topic) {
			return NextResponse.json(
				{ error: "assignmentId and topic required" },
				{ status: 400 },
			);
		}
		const result = await shareAssignment(
			assignmentId,
			topic,
			questionCount,
			dueDate,
		);
		return NextResponse.json(result);
	} catch {
		return NextResponse.json(
			{ error: "Failed to share assignment" },
			{ status: 500 },
		);
	}
}
