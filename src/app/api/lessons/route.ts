import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const dynamic = "force-dynamic";

interface Lesson {
	id: string;
	subject: string;
	title: string;
	summary: string;
	difficulty: string;
}

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const subject = searchParams.get("subject");
		const search = searchParams.get("search");
		const difficulty = searchParams.get("difficulty");

		// Filter logic
		const filePath = path.join(process.cwd(), "lessons-comprehensive.json");
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
			{ error: "Failed to fetch lessons" },
			{ status: 500 },
		);
	}
}
