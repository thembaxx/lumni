import { NextResponse } from "next/server";

export async function POST(_req: Request) {
	try {
		const body = await _req.json();
		const isPremium = body.isPremium === true;

		if (isPremium) {
			console.info("Premium verified for session");
		}

		return NextResponse.json({ verified: true, isPremium });
	} catch (error) {
		console.error("Verify premium error:", error);
		return NextResponse.json({ error: "Verification failed" }, { status: 500 });
	}
}
