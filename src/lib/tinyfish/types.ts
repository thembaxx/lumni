export interface TinyFishSearchResult {
	position: number;
	site_name: string;
	title: string;
	snippet: string;
	url: string;
}

export interface TinyFishSearchResponse {
	query: string;
	results: TinyFishSearchResult[];
	total_results: number;
}

export interface TinyFishFetchResult {
	url: string;
	final_url?: string;
	title: string;
	description?: string;
	language?: string;
	text: string;
}

export interface TinyFishFetchError {
	url: string;
	error: string;
}

export interface TinyFishFetchResponse {
	results: TinyFishFetchResult[];
	errors: TinyFishFetchError[];
}

export interface WebSource {
	url: string;
	title: string;
	snippet: string;
	content: string;
	contentTruncated: boolean;
}

export interface RagContext {
	sources: WebSource[];
	xml: string;
	domainsQueried: string[];
}

export interface TinyFishSearchOptions {
	location?: string;
	language?: string;
	numResults?: number;
}

export interface TinyFishFetchOptions {
	format?: "markdown" | "html" | "json";
	ttl?: number;
	maxCharacters?: number;
}
