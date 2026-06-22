import { beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/lib/server/auth", () => ({
  auth: async () => "test-user-id",
}));

const mockFetch = vi.fn<(url: string | URL, options?: RequestInit) => Promise<Response>>();

beforeEach(() => {
  mockFetch.mockReset();
  globalThis.fetch = mockFetch;
});

const { getExamMarkdown } = await import("../exam-markdown");

describe("getExamMarkdown", () => {
  test("returns error when no fileUrl provided", async () => {
    const result = await getExamMarkdown("");

    expect(result.source).toBe("error");
    expect(result.error).toBe("No file URL provided");
    expect(result.content).toBe("");
  });

  test("returns content from uploadthing when markdown exists", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, options?: RequestInit) => {
      callCount++;
      if (callCount === 1 && options?.method === "HEAD") {
        return new Response(null, { status: 200 });
      }
      return new Response("# Exam Content\n\nQuestion 1", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("uploadthing");
    expect(result.content).toBe("# Exam Content\n\nQuestion 1");
  });

  test("falls back to markdown.new when firecrawl and uploadthing both fail", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response(null, { status: 404 });
      }
      if (callCount === 2) {
        return new Response(null, { status: 500 });
      }
      return new Response("Converted markdown content", {
        status: 200,
        headers: { "Content-Type": "text/markdown" },
      });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("markdown.new");
    expect(result.content).toBe("Converted markdown content");
  });

  test("falls back to markdown.new when uploadthing and firecrawl throw", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        throw new Error("Network error");
      }
      if (callCount === 2) {
        throw new Error("Firecrawl timeout");
      }
      return new Response("Converted content", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("markdown.new");
  });

  test("returns error when both firecrawl and markdown.new fail", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) return new Response(null, { status: 404 });
      if (callCount === 2) return new Response(null, { status: 500 });
      return new Response("Not Found", { status: 404 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("error");
    expect(result.error).toContain("Conversion failed");
  });

  test("returns error when both firecrawl and markdown.new return empty", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) return new Response(null, { status: 404 });
      if (callCount === 2)
        return new Response(null, {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      return new Response("", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("error");
    expect(result.error).toContain("Empty response");
  });

  test("replaces .pdf extension with .md for uploadthing check", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (url: string | URL, options?: RequestInit) => {
      callCount++;
      const urlStr = url.toString();
      if (options?.method === "HEAD" && urlStr.endsWith(".md")) {
        return new Response(null, { status: 200 });
      }
      if (callCount === 2) {
        return new Response("markdown content", { status: 200 });
      }
      return new Response(null, { status: 404 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.PDF");

    expect(result.source).toBe("uploadthing");
  });

  test("returns content from firecrawl when uploadthing misses", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response(null, { status: 404 });
      }
      if (callCount === 2) {
        return new Response(
          JSON.stringify({
            data: { markdown: "# Firecrawl Output\n\nQuestion 1" },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      return new Response("should not reach here", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("firecrawl");
    expect(result.content).toBe("# Firecrawl Output\n\nQuestion 1");
  });

  test("firecrawl timeout falls through to markdown.new", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response(null, { status: 404 });
      }
      if (callCount === 2) {
        return new Response(null, { status: 408 });
      }
      return new Response("Fallback content", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("markdown.new");
    expect(result.content).toBe("Fallback content");
  });

  test("firecrawl empty markdown falls through to markdown.new", async () => {
    let callCount = 0;
    mockFetch.mockImplementation(async (_url: string | URL, _options?: RequestInit) => {
      callCount++;
      if (callCount === 1) {
        return new Response(null, { status: 404 });
      }
      if (callCount === 2) {
        return new Response(JSON.stringify({ data: { markdown: "" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("Fallback content", { status: 200 });
    });

    const result = await getExamMarkdown("https://utfs.io/f/exam.pdf");

    expect(result.source).toBe("markdown.new");
    expect(result.content).toBe("Fallback content");
  });
});
