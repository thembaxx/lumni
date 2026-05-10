import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { account } from "@/lib/appwrite";

export async function GET(_request: NextRequest) {
	try {
		const user = await account.get();
		return NextResponse.json({
			userId: user.$id,
			name: user.name,
			email: user.email,
		});
	} catch {
		return NextResponse.json({ userId: null, name: null, email: null });
	}
}
