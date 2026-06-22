import Exa from "exa-js";
import type { SearchResultItem } from "./search-service";

export interface WebSearchOptions {
  numResults?: number;
  type?: "auto" | "fast" | "instant" | "deep-lite" | "deep" | "deep-reasoning";
  category?:
    | "company"
    | "research paper"
    | "news"
    | "pdf"
    | "personal site"
    | "financial report"
    | "people";
  includeDomains?: string[];
  excludeDomains?: string[];
}

let exaClient: Exa | null = null;

function getClient(): Exa {
  if (!exaClient) {
    const apiKey = process.env.EXA_API_KEY;
    if (!apiKey) {
      throw new Error("EXA_API_KEY is not configured");
    }
    exaClient = new Exa(apiKey);
  }
  return exaClient;
}

export async function searchWeb(
  query: string,
  options?: WebSearchOptions,
): Promise<SearchResultItem[]> {
  if (!query.trim() || query.length < 2) return [];

  const client = getClient();

  const result = await client.search(query, {
    type: options?.type ?? "auto",
    numResults: options?.numResults ?? 8,
    ...(options?.category && { category: options.category }),
    ...(options?.includeDomains && { includeDomains: options.includeDomains }),
    ...(options?.excludeDomains && { excludeDomains: options.excludeDomains }),
    contents: {
      text: { maxCharacters: 500 },
    },
  });

  return result.results.flatMap((r, i) =>
    r.title && r.url
      ? [
          {
            id: `web-${i}`,
            type: "web" as const,
            title: r.title ?? r.url,
            snippet: (r as { text?: string }).text?.slice(0, 200) ?? "",
            subject: "",
            url: r.url,
            createdAt: r.publishedDate ? new Date(r.publishedDate).getTime() : Date.now(),
          },
        ]
      : [],
  );
}

async function _getWebContents(urls: string[]): Promise<Record<string, string>> {
  const client = getClient();
  const result = await client.getContents(urls, {
    text: { maxCharacters: 5_000 },
  });

  const map: Record<string, string> = {};
  for (const r of result.results) {
    const text = (r as { text?: string }).text;
    if (text) {
      map[r.url] = text;
    }
  }
  return map;
}
