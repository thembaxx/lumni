export interface WebSearchResult {
	title: string;
	url: string;
	snippet: string;
	source?: string;
}

export interface WebSearchOptions {
	numResults?: number;
	location?: string;
	language?: string;
}

export interface WebSearchProvider {
	search(query: string, options?: WebSearchOptions): Promise<WebSearchResult[]>;
	fetchContents?(urls: string[]): Promise<Record<string, string>>;
	name: string;
}
