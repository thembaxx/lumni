import { NextResponse } from "next/server";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

export async function POST(request: Request) {
	if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
		return NextResponse.json(
			{ valid: false, error: "Server configuration error" },
			{ status: 500 },
		);
	}

	try {
		const body = await request.json();
		const { email, password } = body;

		if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
			return NextResponse.json({ valid: true });
		}

		return NextResponse.json(
			{ valid: false, error: "Invalid credentials" },
			{ status: 401 },
		);
	} catch {
		return NextResponse.json(
			{ valid: false, error: "Invalid request" },
			{ status: 400 },
		);
	}
}
