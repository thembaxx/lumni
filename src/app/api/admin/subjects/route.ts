import { type NextRequest, NextResponse } from "next/server";
import type { Subject } from "@/lib/db/client";
import {
	COLLECTIONS,
	createDocument,
	deleteDocument,
	listDocuments,
	updateDocument,
} from "@/lib/db/client";
import { requireAdmin } from "@/lib/server/auth";

function mapSubject(s: Subject) {
	return { ...s, id: s.code || s.$id };
}

export async function GET() {
	try {
		await requireAdmin();

		const subjects = await listDocuments<Subject>(COLLECTIONS.SUBJECTS);
		return NextResponse.json({ subjects: subjects.map(mapSubject) });
	} catch (error) {
		console.error("Server error:", error);
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
		await requireAdmin();

		const body = await request.json();
		const { name, code, description, category, color } = body;

		if (!name || !code) {
			return NextResponse.json(
				{ error: "Name and code are required" },
				{ status: 400 },
			);
		}

		const id = code.toLowerCase().replace(/\s+/g, "-");

		await createDocument(COLLECTIONS.SUBJECTS, {
			name,
			code,
			description,
			category: category || "general",
			color,
		});

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
		await requireAdmin();

		const body = await request.json();
		const { id, name, code, description, category } = body;

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		const updateData: Record<string, unknown> = {
			name,
			description,
			category,
		};
		if (code) {
			updateData.code = code.toLowerCase().replace(/\s+/g, "-");
		}

		await updateDocument(COLLECTIONS.SUBJECTS, id, updateData);

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
		await requireAdmin();

		const { searchParams } = new URL(request.url);
		const id = searchParams.get("id");

		if (!id) {
			return NextResponse.json({ error: "ID is required" }, { status: 400 });
		}

		await deleteDocument(COLLECTIONS.SUBJECTS, id);

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
