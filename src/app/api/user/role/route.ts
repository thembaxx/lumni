import { NextResponse } from "next/server";
import { Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite";
import { auth, getAuthenticatedUserId } from "@/lib/server/auth";

const VALID_ROLES = ["teacher", "parent", "student"] as const;

export async function POST(request: Request) {
	const userId = await auth();
	const { role } = (await request.json()) as { role?: string };
	if (!role || !VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
		return NextResponse.json({ error: "Invalid role" }, { status: 400 });
	}

	try {
		const usersApi = new Users(serverClient);
		const user = await usersApi.get(userId);
		const existingLabels = user.labels.filter(
			(l) => !VALID_ROLES.includes(l as (typeof VALID_ROLES)[number]),
		);
		const updated = await usersApi.updateLabels(userId, [
			...existingLabels,
			role,
		]);
		return NextResponse.json({ labels: updated.labels });
	} catch (error) {
		console.error("[role] Failed to set role:", error);
		return NextResponse.json({ error: "Failed to set role" }, { status: 500 });
	}
}
