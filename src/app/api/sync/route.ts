import { NextRequest, NextResponse } from "next/server";
import {
	checkSubjectStatus,
	refreshSubject,
	syncAllSubjects,
	syncSubject,
} from "@/lib/server/sync-actions";

export async function POST(req: NextRequest) {
	try {
		const body = await req.json();
		const { subject, action } = body;

		switch (action) {
			case "sync": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await syncSubject(subject);
				return NextResponse.json(result);
			}

			case "refresh": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await refreshSubject(subject);
				return NextResponse.json(result);
			}

			case "check": {
				if (!subject) {
					return NextResponse.json(
						{ error: "Missing subject" },
						{ status: 400 },
					);
				}
				const result = await checkSubjectStatus(subject);
				return NextResponse.json(result);
			}

			case "sync-all": {
				const result = await syncAllSubjects();
				return NextResponse.json(result);
			}

			default:
				return NextResponse.json({ error: "Unknown action" }, { status: 400 });
		}
	} catch (error) {
		console.error("Sync API error:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Unknown error" },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		status: "ok",
		message:
			"Question Engine v2 active. Generate questions via POST /api/engine/generate",
	});
}
