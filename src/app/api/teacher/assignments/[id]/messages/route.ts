import { NextResponse } from "next/server";

export async function GET(
	_request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const raw = localStorage.getItem(`lumni_messages_${id}`);
	const messages = raw ? JSON.parse(raw) : [];
	return NextResponse.json(messages);
}

export async function POST(
	request: Request,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	const { content, senderRole } = await request.json();
	const msg = {
		assignmentId: id,
		senderId: "current",
		senderRole: senderRole || "teacher",
		content,
		createdAt: Date.now(),
	};
	const raw = localStorage.getItem(`lumni_messages_${id}`);
	const messages = raw ? JSON.parse(raw) : [];
	messages.push(msg);
	localStorage.setItem(`lumni_messages_${id}`, JSON.stringify(messages));
	return NextResponse.json(msg);
}
