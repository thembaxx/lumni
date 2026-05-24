import { NextResponse } from "next/server";
import { auth, getAuthenticatedUserId } from "@/lib/server/auth";
import {
	getParentConsentStatus,
	grantParentConsent,
	revokeParentConsent,
} from "@/lib/server/parent-service";

export async function GET(request: Request) {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}
	const { searchParams } = new URL(request.url);
	const studentId = searchParams.get("studentId");
	if (!studentId) {
		return NextResponse.json(
			{ error: "studentId query param required" },
			{ status: 400 },
		);
	}
	const status = await getParentConsentStatus(userId, studentId);
	return NextResponse.json({ status });
}

export async function POST(request: Request) {
	const userId = await auth();
	const { studentId, canViewProgress, canViewScores } =
		(await request.json()) as {
			studentId?: string;
			canViewProgress?: boolean;
			canViewScores?: boolean;
		};
	if (!studentId) {
		return NextResponse.json({ error: "studentId required" }, { status: 400 });
	}
	try {
		await grantParentConsent(
			userId,
			studentId,
			canViewProgress ?? true,
			canViewScores ?? true,
		);
		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("[parent/consent] Failed:", error);
		return NextResponse.json(
			{ error: "Failed to update consent" },
			{ status: 500 },
		);
	}
}

export async function DELETE(request: Request) {
	const userId = await auth();
	const { studentId } = (await request.json()) as { studentId?: string };
	if (!studentId) {
		return NextResponse.json({ error: "studentId required" }, { status: 400 });
	}
	try {
		await revokeParentConsent(userId, studentId);
		return NextResponse.json({ success: true });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to revoke consent" },
			{ status: 500 },
		);
	}
}
