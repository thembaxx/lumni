import { Query } from "appwrite";
import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite.server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

interface GhostLink {
	token: string;
	teacherId: string;
	createdAt: number;
	expiresAt: number;
	revoked: boolean;
}

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ token: string }> },
) {
	const { token } = await params;

	if (!token || typeof token !== "string") {
		return NextResponse.json({ error: "Invalid token" }, { status: 400 });
	}

	let link: GhostLink | null = null;

	try {
		const docs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			COLLECTIONS.GHOST_LINKS,
			[Query.equal("token", token), Query.limit(1)],
		);
		if (docs.documents.length > 0) {
			link = docs.documents[0] as unknown as GhostLink;
		}
	} catch (e) {
		logError("GhostTokenFetch", e);
		return NextResponse.json(
			{ error: "Failed to verify token" },
			{ status: 500 },
		);
	}

	if (!link) {
		return NextResponse.json(
			{ error: "Invalid or expired token" },
			{ status: 404 },
		);
	}
	if (link.revoked || link.expiresAt < Date.now()) {
		return NextResponse.json(
			{ error: "Token expired or revoked" },
			{ status: 403 },
		);
	}

	// Ghost link is a public aggregate view — quiz data lives in per-student
	// Dexie (client-side IndexedDB), not Appwrite. Return empty aggregates
	// until quiz attempts are synced to a server-side store.
	return NextResponse.json({
		totalStudents: 0,
		subjectEnrollments: {},
		avgScores: {},
		totalQuizAttempts: 0,
		completionRate: 0,
		lastUpdated: Date.now(),
	});
}
