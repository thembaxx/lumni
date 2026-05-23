import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	getParentStudents,
	getChildSubjectProgress,
	getChildActivityTimeline,
} from "@/lib/server/parent-service";

export async function GET() {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}

	const students = await getParentStudents(userId);

	const childrenData = await Promise.all(
		students.map(async (s) => {
			const [subjects, activities] = await Promise.all([
				getChildSubjectProgress(s.id, true, true),
				getChildActivityTimeline(s.id),
			]);
			return { student: s, subjects, activities };
		}),
	);

	return NextResponse.json({ children: childrenData });
}
