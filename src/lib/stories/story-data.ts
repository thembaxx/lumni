import type { Story, StoryMeta } from "./types";

export type { StoryMeta } from "./types";

const STORY_IMPORTS: Record<string, () => Promise<StoryMeta[]>> = {
	"english-home-language": () =>
		import("@/curriculum/stories/english-home-language/index").then(
			(m) => m.storyMetas,
		),
	"afrikaans-home-language": () =>
		import("@/curriculum/stories/afrikaans-home-language/index").then(
			(m) => m.storyMetas,
		),
	"isi-zulu-home-language": () =>
		import("@/curriculum/stories/isi-zulu-home-language/index").then(
			(m) => m.storyMetas,
		),
	"isi-xhosa-home-language": () =>
		import("@/curriculum/stories/isi-xhosa-home-language/index").then(
			(m) => m.storyMetas,
		),
};

const STORY_CONTENT_IMPORTS: Record<string, () => Promise<{ default: Story }>> =
	{
		"south-african-folk-tales": () =>
			import(
				"@/curriculum/stories/english-home-language/south-african-folk-tales.json"
			).then((m) => ({ default: m.default as unknown as Story })),
	};

let metasCache: StoryMeta[] | null = null;
const metasByLang: Record<string, StoryMeta[]> = {};

export async function getAllStoryMetas(): Promise<StoryMeta[]> {
	if (metasCache) return metasCache;
	const all: StoryMeta[] = [];
	for (const [langId, loader] of Object.entries(STORY_IMPORTS)) {
		try {
			const langMetas = await loader();
			metasByLang[langId] = langMetas;
			all.push(...langMetas);
		} catch {
			// language directory has no stories yet
		}
	}
	metasCache = all;
	return all;
}

export async function getStoryMetasByLanguage(
	languageId: string,
): Promise<StoryMeta[]> {
	if (metasByLang[languageId]) return metasByLang[languageId];
	try {
		const loader = STORY_IMPORTS[languageId];
		if (!loader) return [];
		const metas = await loader();
		metasByLang[languageId] = metas;
		return metas;
	} catch {
		return [];
	}
}

export async function loadStoryContent(id: string): Promise<Story | null> {
	try {
		const loader = STORY_CONTENT_IMPORTS[id];
		if (!loader) return null;
		const mod = await loader();
		return mod.default as Story;
	} catch {
		return null;
	}
}

export function getLanguageLabel(languageId: string): string {
	const map: Record<string, string> = {
		"english-home-language": "English",
		"afrikaans-home-language": "Afrikaans",
		"isi-zulu-home-language": "isiZulu",
		"isi-xhosa-home-language": "isiXhosa",
	};
	return map[languageId] ?? languageId;
}
