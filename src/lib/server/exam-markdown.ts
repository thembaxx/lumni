"use server";

import { auth } from "@/lib/server/auth";

export interface GetExamMarkdownResult {
  content: string;
  source: "uploadthing" | "firecrawl" | "markdown.new" | "error";
  error?: string;
}

async function convertWithFirecrawl(url: string): Promise<{ content: string | null; ok: boolean }> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const apiKey = process.env.FIRECRAWL_API_KEY;
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch("https://api.firecrawl.dev/v2/scrape", {
      method: "POST",
      headers,
      body: JSON.stringify({ url, formats: ["markdown"] }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return { content: null, ok: false };
    }

    const data = await response.json();
    const markdown = data?.data?.markdown;

    if (!markdown || typeof markdown !== "string" || markdown.trim().length === 0) {
      return { content: null, ok: false };
    }

    return { content: markdown, ok: true };
  } catch {
    return { content: null, ok: false };
  }
}

export async function getExamMarkdown(fileUrl: string): Promise<GetExamMarkdownResult> {
  const userId = await auth();
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
    const firecrawl = await convertWithFirecrawl(fileUrl);

    if (firecrawl.ok && firecrawl.content) {
      return {
        content: firecrawl.content,
        source: "firecrawl",
      };
    }
  } catch {
    // Firecrawl failed, try next provider
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
