import { NextResponse } from "next/server";
import { AppError } from "@/lib/errors";

export async function POST(_req: Request) {
	try {
		const body = await _req.json();
		if (!body || typeof body !== "object") {
			throw AppError.badRequest("Invalid body");
		}
		const isPremium = body.isPremium === true;

		return NextResponse.json({ verified: true, isPremium });
	} catch (error) {
		console.error("Verify premium error:", error);
		return NextResponse.json({ error: "Verification failed" }, { status: 500 });
	}
}
