import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth";
import {
	linkStudentToTeacher,
	unlinkStudentFromTeacher,
} from "@/lib/server/teacher-service";

export async function POST(request: Request) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}
	const { studentId, subjectId } = (await request.json()) as {
		studentId?: string;
		subjectId?: string;
	};
	if (!studentId) {
		return NextResponse.json(
			{ error: "studentId required" },
			{ status: 400 },
		);
	}
	try {
		await linkStudentToTeacher(userId, studentId, subjectId);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[teacher/link] Failed:", error);
		return NextResponse.json(
			{ error: "Failed to link student" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}
	const { studentId } = (await request.json()) as { studentId?: string };
	if (!studentId) {
		return NextResponse.json(
			{ error: "studentId required" },
			{ status: 400 },
		);
	}
	try {
		await unlinkStudentFromTeacher(userId, studentId);
		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{ error: "Failed to unlink student" },
			{ status: 500 },
		);
	}
}
