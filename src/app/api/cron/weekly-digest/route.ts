import { NextResponse } from "next/server";
import { databases } from "@/lib/appwrite.server";
import { dexieDataAccess } from "@/lib/db";
import { APPWRITE_DATABASE_ID } from "@/lib/db/client";
import { logError } from "@/lib/shared/logger";

export const dynamic = "force-dynamic";

export async function POST() {
	try {
		const { requireAdmin } = await import("@/lib/server/auth");
		await requireAdmin();
	} catch {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
	let totalAttempts = 0;
	let avgScore = 0;
	let topSubjects = "";

	try {
		const attempts = (await dexieDataAccess.quizAttempts.toArray()).filter(
			(a) => a.completedAt >= sevenDaysAgo,
		);
		totalAttempts = attempts.length;
		avgScore =
			totalAttempts > 0
				? Math.round(
						(attempts.reduce((s, a) => s + a.score, 0) / totalAttempts) * 100,
					) / 100
				: 0;

		const subjMap = new Map<string, number[]>();
		for (const a of attempts) {
			const arr = subjMap.get(a.odSubject) ?? [];
			arr.push(a.score);
			subjMap.set(a.odSubject, arr);
		}
		topSubjects = [...subjMap.entries()]
			.map(([subject, scores]) => ({
				subject,
				avg: Math.round(
					(scores.reduce((s, sc) => s + sc, 0) / scores.length) * 100,
				),
			}))
			.sort((a, b) => b.avg - a.avg)
			.slice(0, 3)
			.map((s) => `${s.subject} (${s.avg}%)`)
			.join(", ");
	} catch (e) {
		logError("WeeklyDigestStats", e);
	}

	const title = "Your Weekly Lumni Digest";
	const body = `You completed ${totalAttempts} quiz${totalAttempts === 1 ? "" : "zes"} this week with ${avgScore}% average.${topSubjects ? ` Top subjects: ${topSubjects}.` : ""} Keep it up!`;

	let sent = 0;
	let total = 0;

	try {
		const docs = await databases.listDocuments(
			APPWRITE_DATABASE_ID,
			"push_subscriptions",
		);
		total = docs.documents.length;

		if (total > 0) {
			const { default: webpush } = await import("web-push");
			webpush.setVapidDetails(
				"mailto:study@lumni.app",
				process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "",
				process.env.VAPID_PRIVATE_KEY ?? "",
			);

			const results = await Promise.allSettled(
				docs.documents.map((sub: Record<string, unknown>) => {
					const subscription = {
						endpoint: sub.endpoint as string,
						keys: {
							auth: sub.auth as string,
							p256dh: sub.p256dh as string,
						},
					};
					return webpush.sendNotification(
						subscription,
						JSON.stringify({ title, body, url: "/dashboard" }),
					);
				}),
			);
			sent = results.filter((r) => r.status === "fulfilled").length;
		}
	} catch (e) {
		logError("WeeklyDigestPush", e);
	}

	return NextResponse.json({ success: true, sent, total });
}
