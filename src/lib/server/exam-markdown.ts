"use server";

import { getAuthenticatedUserId } from "@/lib/server/auth";

export interface GetExamMarkdownResult {
	content: string;
	source: "uploadthing" | "markdown.new" | "error";
	error?: string;
}

export async function getExamMarkdown(
	fileUrl: string,
): Promise<GetExamMarkdownResult> {
	const userId = await getAuthenticatedUserId();
	if (!userId) {
		return {
			content: "",
			source: "error",
			error: "Authentication required",
		};
	}
	if (!fileUrl) {
		return {
			content: "",
			source: "error",
			error: "No file URL provided",
		};
	}

	const markdownUrl = fileUrl.replace(/\.pdf$/i, ".md");

	try {
		const markdownResponse = await fetch(markdownUrl, {
			method: "HEAD",
		});

		if (markdownResponse.ok) {
			const content = await fetch(markdownUrl, {
				method: "GET",
			}).then((res) => res.text());

			return {
				content,
				source: "uploadthing",
			};
		}
	} catch {
		// Markdown not found on uploadthing, try conversion
	}

	try {
		const encodedUrl = encodeURIComponent(fileUrl);
		const convertUrl = `https://markdown.new/${encodedUrl}`;

		const response = await fetch(convertUrl, {
			method: "GET",
			headers: {
				Accept: "text/markdown",
			},
		});

		if (!response.ok) {
			throw new Error(`Conversion failed: ${response.status}`);
		}

		const content = await response.text();

		if (!content || content.trim().length === 0) {
			throw new Error("Empty response from conversion API");
		}

		return {
			content,
			source: "markdown.new",
		};
	} catch (err) {
		return {
			content: "",
			source: "error",
			error: err instanceof Error ? err.message : "Failed to convert PDF",
		};
	}
}
