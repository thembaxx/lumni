import { NextResponse } from "next/server";

export async function POST() {
	const token = crypto.randomUUID();
	const link = {
		token,
		teacherId: "ghost",
		createdAt: Date.now(),
		expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000,
		revoked: false,
	};
	localStorage.setItem(`lumni_ghost_${token}`, JSON.stringify(link));
	return NextResponse.json({
		token,
		url: `/ghost/${token}`,
		expiresAt: link.expiresAt,
	});
}

export async function DELETE(request: Request) {
	const { token } = await request.json();
	localStorage.removeItem(`lumni_ghost_${token}`);
	return NextResponse.json({ success: true });
}
