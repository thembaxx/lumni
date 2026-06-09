export interface DictionaryEntry {
	word: string;
	phonetic?: string;
	audio?: string;
	origin?: string;
	meanings: DictionaryMeaning[];
	sourceUrls: string[];
}

export interface DictionaryMeaning {
	partOfSpeech: string;
	definitions: {
		definition: string;
		example?: string;
		synonyms: string[];
		antonyms: string[];
	}[];
}

export interface DictionaryCacheEntry {
	key: string;
	word: string;
	language: string;
	result: DictionaryEntry[];
	fetchedAt: number;
	expiresAt: number;
}
