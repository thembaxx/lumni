import { NextResponse } from "next/server";
import { seedDatabase } from "@/lib/seed";

const CSRF_TOKEN_KEY = "x-csrf-token";
const ENV_TOKEN = process.env.SEED_CSRF_TOKEN || "";

function isValidRequest(request: Request): boolean {
	const csrf = request.headers.get(CSRF_TOKEN_KEY);
	if (ENV_TOKEN && csrf !== ENV_TOKEN) {
		console.warn("Seed CSRF token mismatch");
		return false;
	}
	const origin = request.headers.get("origin");
	const host = request.headers.get("host");
	if (
		origin &&
		host &&
		!origin.includes(host) &&
		!origin.includes("localhost") &&
		!origin.includes("127.0.0.1")
	) {
		console.warn("Seed origin mismatch:", origin, host);
		return false;
	}
	return true;
}

export async function POST(request: Request) {
	if (!isValidRequest(request)) {
		return NextResponse.json(
			{ success: false, error: "Unauthorized" },
			{ status: 403 },
		);
	}

	try {
		await seedDatabase();
		return NextResponse.json({
			success: true,
			message: "Database seeded successfully",
		});
	} catch (error) {
		console.error("Seed error:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 },
		);
	}
}

export async function GET() {
	return NextResponse.json({
		message: "Use POST to seed the database",
	});
}
