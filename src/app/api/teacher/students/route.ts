import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	getTeacherStudents,
	getTeacherTopicMastery,
} from "@/lib/server/teacher-service";

export async function GET() {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const [students, topicMastery] = await Promise.all([
		getTeacherStudents(userId),
		getTeacherTopicMastery(userId),
	]);

	return NextResponse.json({ students, topicMastery });
}
