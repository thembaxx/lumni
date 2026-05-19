import { NextResponse } from "next/server";

export interface ApiErrorBody {
	error: string;
	code?: string;
}

export function apiError(
	message: string,
	status: number,
	code?: string,
): NextResponse {
	return NextResponse.json({ error: message, code } satisfies ApiErrorBody, {
		status,
	});
}

export function apiSuccess<T>(data: T, status = 200): NextResponse {
	return NextResponse.json({ success: true, data }, { status });
}
