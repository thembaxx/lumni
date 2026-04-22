import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url);
		const subject = searchParams.get("subject");
		const search = searchParams.get("search");
		const difficulty = searchParams.get("difficulty");

		// Filter logic
		const lessonsData = require("../../../../lessons.json");
		let filteredLessons = lessonsData.lessons;

		if (subject && subject !== "") {
			filteredLessons = filteredLessons.filter(
				(l) => l.subject.toLowerCase() === subject.toLowerCase(),
			);
		}

		if (search && search !== "") {
			filteredLessons = filteredLessons.filter((l) =>
				l.title.toLowerCase().includes(search.toLowerCase()),
			);
		}

		if (difficulty && difficulty !== "") {
			filteredLessons = filteredLessons.filter(
				(l) => l.difficulty === difficulty,
			);
		}

		return NextResponse.json({ lessons: filteredLessons });
	} catch (error) {
		console.error("Lessons API error:", error);
		return NextResponse.json(
			{ error: "Failed to fetch lessons" },
			{ status: 500 },
		);
	}
}
