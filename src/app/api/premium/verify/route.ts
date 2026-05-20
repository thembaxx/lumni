import { NextResponse } from "next/server";

export async function POST(_req: Request) {
	try {
		const body = await _req.json();
		if (!body || typeof body !== "object") {
			return NextResponse.json({ error: "Invalid body" }, { status: 400 });
		}
		const isPremium = body.isPremium === true;

		return NextResponse.json({ verified: true, isPremium });
	} catch (error) {
		console.error("Verify premium error:", error);
		return NextResponse.json({ error: "Verification failed" }, { status: 500 });
	}
}
