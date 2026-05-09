import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getSql } from "@/lib/db/client";

export async function POST() {
	try {
		const sql = getSql();

		const existingResult =
			await sql`SELECT id FROM users WHERE email = ${"admin@lumni.com"}`;

		if (existingResult.length > 0) {
			return NextResponse.json({
				success: true,
				message: "User already exists",
				userId: existingResult[0].id,
			});
		}

		const userId = randomUUID();
		await sql`INSERT INTO users (id, name, email, email_verified, created_at, updated_at)
			 VALUES (${userId}, ${"Admin"}, ${"admin@lumni.com"}, ${false}, now(), now())`;

		return NextResponse.json({
			success: true,
			message: "User created successfully",
			userId,
		});
	} catch (error) {
		console.error("Create user error:", error);
		return NextResponse.json(
			{ success: false, error: String(error) },
			{ status: 500 },
		);
	}
}
