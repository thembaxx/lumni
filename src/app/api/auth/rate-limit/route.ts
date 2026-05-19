import { type NextRequest, NextResponse } from "next/server";
import { databases } from "@/lib/appwrite";
import { Query } from "appwrite";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/db/client";

export const dynamic = "force-dynamic";

function normalizeEmail(email: string): string {
	return email.toLowerCase().trim();
}

export async function POST(req: NextRequest) {
	try {
		const { email: rawEmail, action } = await req.json();

		if (!rawEmail || !action) {
			return NextResponse.json({ error: "Missing email or action" }, { status: 400 });
		}

		const email = normalizeEmail(rawEmail);
		const ip =
			req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
			req.headers.get("x-real-ip")?.trim() ||
			"unknown";

		if (!APPWRITE_DATABASE_ID || !databases) {
			return NextResponse.json({ allowed: true });
		}

		const now = Date.now();
		const fiveMinutesAgo = new Date(now - 5 * 60 * 1000).toISOString();

		if (action === "success") {
			await databases.createDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				"unique()",
				{
					eventType: "auth_attempt",
					userId: email,
					subjectId: "success",
					metadata: JSON.stringify({ ip }),
					timestamp: new Date().toISOString(),
				},
			);
			return NextResponse.json({ allowed: true });
		}

		if (action === "signin") {
			// Find the latest successful sign-in to determine the reset window start
			const successDocs = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				[
					Query.equal("eventType", "auth_attempt"),
					Query.equal("userId", email),
					Query.equal("subjectId", "success"),
					Query.greaterThanEqual("timestamp", fiveMinutesAgo),
					Query.orderDesc("timestamp"),
					Query.limit(1),
				],
			);

			const sinceTime =
				successDocs.documents.length > 0
					? successDocs.documents[0].timestamp
					: fiveMinutesAgo;

			// Count failed/attempted sign-ins since the last success
			const signinDocs = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				[
					Query.equal("eventType", "auth_attempt"),
					Query.equal("userId", email),
					Query.equal("subjectId", "signin"),
					Query.greaterThanEqual("timestamp", sinceTime),
					Query.limit(1),
				],
			);

			const count = signinDocs.total;

			if (count >= 3) {
				const oldestDocs = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS,
					[
						Query.equal("eventType", "auth_attempt"),
						Query.equal("userId", email),
						Query.equal("subjectId", "signin"),
						Query.greaterThanEqual("timestamp", sinceTime),
						Query.orderAsc("timestamp"),
						Query.limit(1),
					],
				);

				const oldestTime =
					oldestDocs.documents.length > 0
						? new Date(oldestDocs.documents[0].timestamp).getTime()
						: now;

				const resetAt = oldestTime + 5 * 60 * 1000;
				const waitMinutes = Math.ceil((resetAt - now) / 60000);

				return NextResponse.json({
					allowed: false,
					resetAt,
					errorMessage: `Too many sign-in attempts. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
				});
			}

			// Under the limit: log this attempt and return allowed
			await databases.createDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				"unique()",
				{
					eventType: "auth_attempt",
					userId: email,
					subjectId: "signin",
					metadata: JSON.stringify({ ip }),
					timestamp: new Date().toISOString(),
				},
			);

			return NextResponse.json({ allowed: true });
		}

		if (action === "magiclink") {
			const magicDocs = await databases.listDocuments(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				[
					Query.equal("eventType", "auth_attempt"),
					Query.equal("userId", email),
					Query.equal("subjectId", "magiclink"),
					Query.greaterThanEqual("timestamp", fiveMinutesAgo),
					Query.limit(1),
				],
			);

			const count = magicDocs.total;

			if (count >= 1) {
				const oldestDocs = await databases.listDocuments(
					APPWRITE_DATABASE_ID,
					COLLECTIONS.ANALYTICS,
					[
						Query.equal("eventType", "auth_attempt"),
						Query.equal("userId", email),
						Query.equal("subjectId", "magiclink"),
						Query.greaterThanEqual("timestamp", fiveMinutesAgo),
						Query.orderAsc("timestamp"),
						Query.limit(1),
					],
				);

				const oldestTime =
					oldestDocs.documents.length > 0
						? new Date(oldestDocs.documents[0].timestamp).getTime()
						: now;

				const resetAt = oldestTime + 5 * 60 * 1000;
				const waitMinutes = Math.ceil((resetAt - now) / 60000);

				return NextResponse.json({
					allowed: false,
					resetAt,
					errorMessage: `A magic link was already sent. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
				});
			}

			// Under the limit: log this attempt and return allowed
			await databases.createDocument(
				APPWRITE_DATABASE_ID,
				COLLECTIONS.ANALYTICS,
				"unique()",
				{
					eventType: "auth_attempt",
					userId: email,
					subjectId: "magiclink",
					metadata: JSON.stringify({ ip }),
					timestamp: new Date().toISOString(),
				},
			);

			return NextResponse.json({ allowed: true });
		}

		return NextResponse.json({ error: "Invalid action" }, { status: 400 });
	} catch (error) {
		console.error("[/api/auth/rate-limit] Error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
