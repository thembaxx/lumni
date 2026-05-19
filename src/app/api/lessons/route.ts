import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const dynamic = "force-dynamic";

interface Lesson {
	id: string;
	subject: string;
	title: string;
	summary: string;
	difficulty: string;
}

async function lessonsHandler(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subject = searchParams.get("subject");
		const search = searchParams.get("search");
		const difficulty = searchParams.get("difficulty");

		const filePath = path.resolve("lessons-comprehensive.json");

		if (!fs.existsSync(filePath)) {
			return NextResponse.json({ lessons: [] });
		}

		const lessonsData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
		let filteredLessons: Lesson[] = lessonsData.lessons;

		if (subject && subject !== "") {
			filteredLessons = filteredLessons.filter(
				(l: Lesson) => l.subject.toLowerCase() === subject.toLowerCase(),
			);
		}

		if (search && search !== "") {
			filteredLessons = filteredLessons.filter((l: Lesson) =>
				l.title.toLowerCase().includes(search.toLowerCase()),
			);
		}

		if (difficulty && difficulty !== "") {
			filteredLessons = filteredLessons.filter(
				(l: Lesson) => l.difficulty === difficulty,
			);
		}

		return NextResponse.json({ lessons: filteredLessons });
	} catch (error) {
		console.error("Lessons API error:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to get lessons",
			},
			{ status: 500 },
		);
	}
}

export const GET = withRateLimit(lessonsHandler, {
	max: 20,
	windowMs: 60000,
});
