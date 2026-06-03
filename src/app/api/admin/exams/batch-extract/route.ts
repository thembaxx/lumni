import fs from "node:fs";
import path from "node:path";
import { createRouteHandler, HttpError } from "@/lib/api/create-route-handler";

async function fetchParsedPaper(id: string) {
	const filePath = path.resolve(
		process.cwd(),
		"exam-data",
		"parsed",
		`${id}.json`,
	);
	if (fs.existsSync(filePath)) {
		return JSON.parse(fs.readFileSync(filePath, "utf-8"));
	}
	return null;
}

export const GET = createRouteHandler({
	auth: "admin",
	execute: async ({ params }) => {
		const id = params?.id;
		if (!id) throw new HttpError(400, "Missing paper ID");

		const paper = await fetchParsedPaper(id);
		if (!paper) throw new HttpError(404, "Parsed paper not found");

		return paper;
	},
	errorLabel: "Batch extract GET",
});

export const POST = createRouteHandler({
	auth: "admin",
	validate: (body: Record<string, unknown>) => {
		if (!body.urls || !Array.isArray(body.urls))
			return "Missing or invalid urls array";
		return null;
	},
	execute: async ({ body }) => {
		const { urls } = body as { urls: string[] };
		const outputDir = path.resolve(process.cwd(), "exam-data", "extracted");
		if (!fs.existsSync(outputDir)) {
			fs.mkdirSync(outputDir, { recursive: true });
		}

		const results = await Promise.all(
			urls.map(async (url) => {
				try {
					const response = await fetch(url, { cache: "no-store" });
					if (!response.ok) {
						throw new Error(`HTTP ${response.status}`);
					}
					const text = await response.text();
					const fileName = `extracted_${Date.now()}_${Math.random().toString(36).slice(2, 8)}.txt`;
					fs.writeFileSync(path.join(outputDir, fileName), text, "utf-8");
					return { url, success: true };
				} catch (error) {
					return {
						url,
						success: false,
						error: error instanceof Error ? error.message : "Unknown error",
					};
				}
			}),
		);

		return { results };
	},
	errorLabel: "Batch extract POST",
});
