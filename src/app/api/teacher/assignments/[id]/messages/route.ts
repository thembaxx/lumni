import { NextResponse } from "next/server";
import { dexieDataAccess } from "@/lib/db";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	try {
		const messages = await dexieDataAccess.assignmentMessages
			.where("assignmentId")
			.equals(id)
			.toArray();
		return NextResponse.json(messages);
	} catch {
		return NextResponse.json([]);
	}
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const [{ id }, { content, senderRole }] = await Promise.all([
		params,
		request.json(),
	]);
	const msg = {
		assignmentId: id,
		senderId: "current",
		senderRole: senderRole || "teacher",
		content,
		createdAt: Date.now(),
	};
	try {
		await dexieDataAccess.assignmentMessages.add(msg);
	} catch {
		/* silent */
	}
	return NextResponse.json(msg);
}
