import fs from "node:fs";
import path from "node:path";
import { createRouteHandler } from "@/lib/api/create-route-handler";
import { withRateLimit } from "@/lib/shared/with-rate-limit";

export const revalidate = 3600;

interface Lesson {
	id: string;
	subject: string;
	title: string;
	summary: string;
	difficulty: string;
}

export const GET = withRateLimit(
	createRouteHandler({
		auth: "none",
		execute: async ({ req }) => {
			const { searchParams } = new URL(req.url);
			const subject = searchParams.get("subject");
			const search = searchParams.get("search");
			const difficulty = searchParams.get("difficulty");

			const filePath = path.resolve("lessons-comprehensive.json");

			if (!fs.existsSync(filePath)) {
				return { lessons: [] };
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

			return { lessons: filteredLessons };
		},
		errorLabel: "Lessons",
	}),
	{ max: 20, windowMs: 60000 },
);
