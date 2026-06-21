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
	"sesotho-home-language": () =>
		import("@/curriculum/stories/sesotho-home-language/index").then(
			(m) => m.storyMetas,
		),
	"setswana-home-language": () =>
		import("@/curriculum/stories/setswana-home-language/index").then(
			(m) => m.storyMetas,
		),
	"sepedi-home-language": () =>
		import("@/curriculum/stories/sepedi-home-language/index").then(
			(m) => m.storyMetas,
		),
	"xitsonga-home-language": () =>
		import("@/curriculum/stories/xitsonga-home-language/index").then(
			(m) => m.storyMetas,
		),
	"siswati-home-language": () =>
		import("@/curriculum/stories/siswati-home-language/index").then(
			(m) => m.storyMetas,
		),
	"tshivenda-home-language": () =>
		import("@/curriculum/stories/tshivenda-home-language/index").then(
			(m) => m.storyMetas,
		),
	"isi-ndebele-home-language": () =>
		import("@/curriculum/stories/isi-ndebele-home-language/index").then(
			(m) => m.storyMetas,
		),
};

const STORY_CONTENT_IMPORTS: Record<string, () => Promise<{ default: Story }>> =
	{
		"south-african-folk-tales": () =>
			import(
				"@/curriculum/stories/english-home-language/south-african-folk-tales.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"die-slim-vos": () =>
			import(
				"@/curriculum/stories/afrikaans-home-language/die-slim-vos.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"inkosi-yangaphandle": () =>
			import(
				"@/curriculum/stories/isi-zulu-home-language/inkosi-yangaphandle.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"intaka-eflayo": () =>
			import(
				"@/curriculum/stories/isi-xhosa-home-language/intaka-eflayo.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"lekgwapa-le-phiri": () =>
			import(
				"@/curriculum/stories/sesotho-home-language/lekgwapa-le-phiri.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"kgwedi-le-bjana": () =>
			import(
				"@/curriculum/stories/setswana-home-language/kgwedi-le-bjana.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"thuto-ya-khuru": () =>
			import(
				"@/curriculum/stories/sepedi-home-language/thuto-ya-khuru.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"tindzuwa-na-nhwanyana": () =>
			import(
				"@/curriculum/stories/xitsonga-home-language/tindzuwa-na-nhwanyana.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"indvuku-na-manja": () =>
			import(
				"@/curriculum/stories/siswati-home-language/indvuku-na-manja.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"tshifhiwo-na-phalaphala": () =>
			import(
				"@/curriculum/stories/tshivenda-home-language/tshifhiwo-na-phalaphala.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"inkabi-nengwenya": () =>
			import(
				"@/curriculum/stories/isi-ndebele-home-language/inkabi-nengwenya.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"outa-karels-stories": () =>
			import(
				"@/curriculum/stories/english-home-language/outa-karels-stories.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"reynard-fox-south-africa": () =>
			import(
				"@/curriculum/stories/english-home-language/reynard-fox-south-africa.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"thoughts-on-south-africa": () =>
			import(
				"@/curriculum/stories/english-home-language/thoughts-on-south-africa.json"
			).then((m) => ({ default: m.default as unknown as Story })),
		"native-life-south-africa": () =>
			import(
				"@/curriculum/stories/english-home-language/native-life-south-africa.json"
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
		"sesotho-home-language": "Sesotho",
		"setswana-home-language": "Setswana",
		"sepedi-home-language": "Sepedi",
		"xitsonga-home-language": "Xitsonga",
		"siswati-home-language": "siSwati",
		"tshivenda-home-language": "Tshivenda",
		"isi-ndebele-home-language": "isiNdebele",
	};
	return map[languageId] ?? languageId;
}
