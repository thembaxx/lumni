import { NextResponse } from "next/server";
import { auth } from "@/lib/server/auth";
import { userConsentService } from "@/lib/services/user-consent-service";

export async function GET() {
	try {
		const userId = await auth();
		const consent = await userConsentService.get(userId);
		return NextResponse.json({ consent });
	} catch (_error) {
		return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
	}
}

export async function POST(request: Request) {
	try {
		const userId = await auth();
		const body = (await request.json()) as {
			analytics?: boolean;
			marketing?: boolean;
			dataSharing?: boolean;
			tosVersion?: string;
			privacyVersion?: string;
		};

		const consent = await userConsentService.save(userId, body);
		return NextResponse.json({ consent });
	} catch (_error) {
		return NextResponse.json(
			{ error: "Failed to update consent" },
			{ status: 500 },
		);
	}
}
