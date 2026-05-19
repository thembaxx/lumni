import { type NextRequest, NextResponse } from "next/server";
import { Users } from "node-appwrite";
import { serverClient } from "@/lib/appwrite";
import { requireAdmin } from "@/lib/server/auth";

export async function GET() {
	try {
		await requireAdmin();

		const users = new Users(serverClient);
		const response = await users.list();

		const userList = response.users.map((u) => ({
			$id: u.$id,
			email: u.email,
			name: u.name || "",
			status: u.status,
			registration: u.registration,
			accessedAt: u.accessedAt || null,
		}));

		return NextResponse.json({ users: userList });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to fetch users",
			},
			{ status: 500 },
		);
	}
}

export async function PATCH(request: NextRequest) {
	try {
		await requireAdmin();

		const body = await request.json();
		const { userId, action } = body;

		if (!userId || !action) {
			return NextResponse.json(
				{ error: "userId and action are required" },
				{ status: 400 },
			);
		}

		const users = new Users(serverClient);

		if (action === "suspend") {
			await users.updateStatus(userId, false);
		} else if (action === "activate") {
			await users.updateStatus(userId, true);
		} else {
			return NextResponse.json(
				{ error: "action must be 'suspend' or 'activate'" },
				{ status: 400 },
			);
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to update user",
			},
			{ status: 500 },
		);
	}
}
