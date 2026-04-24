import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db/client";
import { subject } from "@/lib/db/schema";

export async function GET() {
	try {
		const db = getDb();
		const allSubjects = await db.select().from(subject);
		return NextResponse.json({ subjects: allSubjects });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to fetch subjects",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { name, code, description, category, color } = body;

		if (!name || !code) {
			return NextResponse.json(
				{ error: "Name and code are required" },
				{ status: 400 },
			);
		}

		const db = getDb();
		const id = code.toLowerCase().replace(/\s+/g, "-");

		await db
			.insert(subject)
			.values({
				id,
				name,
				code,
				description,
				category: category || "general",
				color,
			})
			.onConflictDoNothing();

		return NextResponse.json({ success: true, id });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to create subject",
			},
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const body = await request.json();
		const { id, name, code, description, category } = body;

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const db = getDb();
		const updateData: Record<string, unknown> = {
			name,
			description,
			category,
		};
		if (code) {
			updateData.code = code.toLowerCase().replace(/\s+/g, "-");
		}

		await db.update(subject).set(updateData).where(eq(subject.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to update subject",
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const db = getDb();
		await db.delete(subject).where(eq(subject.id, id));

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to delete subject",
			},
			{ status: 500 },
		);
	}
}
