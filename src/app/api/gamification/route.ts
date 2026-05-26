import { Client, Databases, ID, Query } from "appwrite";
import { type NextRequest, NextResponse } from "next/server";
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT } from "@/lib/appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";
import {
	getAuthenticatedUserId,
	getAuthenticatedUserName,
} from "@/lib/server/auth";

export async function GET() {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ gamification: null });
		}

		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(APPWRITE_PROJECT);
		const db = new Databases(client);

		try {
			const docs = await db.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.USER_GAMIFICATION,
				[Query.equal("userId", userId), Query.limit(1)],
			);
			const record = docs.documents[0] ?? null;
			if (record) {
				const {
					userId: _u,
					$id,
					$collectionId,
					$createdAt,
					$updatedAt,
					$permissions,
					$databaseId,
					...rest
				} = record;
				return NextResponse.json({ gamification: rest });
			}
			return NextResponse.json({ gamification: null });
		} catch {
			return NextResponse.json({ gamification: null });
		}
	} catch (error) {
		console.error("Gamification GET error:", error);
		return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const userId = await getAuthenticatedUserId();
		if (!userId) {
			return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
		}

		const userName = await getAuthenticatedUserName();
		const body = await req.json();
		const client = new Client()
			.setEndpoint(APPWRITE_ENDPOINT)
			.setProject(APPWRITE_PROJECT);
		const db = new Databases(client);

		const payload = {
			...body,
			userId,
			label: userName || body.label || undefined,
		};

		try {
			const docs = await db.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.USER_GAMIFICATION,
				[Query.equal("userId", userId), Query.limit(1)],
			);

			if (docs.documents.length > 0) {
				await db.updateDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.USER_GAMIFICATION,
					docs.documents[0].$id,
					payload,
				);
			} else {
				await db.createDocument(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.USER_GAMIFICATION,
					ID.unique(),
					payload,
				);
			}
			return NextResponse.json({ success: true });
		} catch {
			return NextResponse.json({ success: false }, { status: 500 });
		}
	} catch (error) {
		console.error("Gamification POST error:", error);
		return NextResponse.json({ error: "Failed to sync" }, { status: 500 });
	}
}
