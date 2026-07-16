import type { Story, StoryMeta } from "./types";

export type { StoryMeta } from "./types";

const STORY_IMPORTS: Record<string, () => Promise<StoryMeta[]>> = {
  "english-home-language": () =>
    import("@/curriculum/stories/english-home-language/index").then((m) => m.storyMetas),
  "afrikaans-home-language": () =>
    import("@/curriculum/stories/afrikaans-home-language/index").then((m) => m.storyMetas),
  "isi-zulu-home-language": () =>
    import("@/curriculum/stories/isi-zulu-home-language/index").then((m) => m.storyMetas),
  "isi-xhosa-home-language": () =>
    import("@/curriculum/stories/isi-xhosa-home-language/index").then((m) => m.storyMetas),
  "sesotho-home-language": () =>
    import("@/curriculum/stories/sesotho-home-language/index").then((m) => m.storyMetas),
  "setswana-home-language": () =>
    import("@/curriculum/stories/setswana-home-language/index").then((m) => m.storyMetas),
  "sepedi-home-language": () =>
    import("@/curriculum/stories/sepedi-home-language/index").then((m) => m.storyMetas),
  "xitsonga-home-language": () =>
    import("@/curriculum/stories/xitsonga-home-language/index").then((m) => m.storyMetas),
  "siswati-home-language": () =>
    import("@/curriculum/stories/siswati-home-language/index").then((m) => m.storyMetas),
  "tshivenda-home-language": () =>
    import("@/curriculum/stories/tshivenda-home-language/index").then((m) => m.storyMetas),
  "isi-ndebele-home-language": () =>
    import("@/curriculum/stories/isi-ndebele-home-language/index").then((m) => m.storyMetas),
};

const STORY_CONTENT_IMPORTS: Record<string, () => Promise<{ default: Story }>> = {
  "south-african-folk-tales": () =>
    import("@/curriculum/stories/english-home-language/south-african-folk-tales.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
  "die-slim-vos": () =>
    import("@/curriculum/stories/afrikaans-home-language/die-slim-vos.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "inkosi-yangaphandle": () =>
    import("@/curriculum/stories/isi-zulu-home-language/inkosi-yangaphandle.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "intaka-eflayo": () =>
    import("@/curriculum/stories/isi-xhosa-home-language/intaka-eflayo.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "lekgwapa-le-phiri": () =>
    import("@/curriculum/stories/sesotho-home-language/lekgwapa-le-phiri.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "kgwedi-le-bjana": () =>
    import("@/curriculum/stories/setswana-home-language/kgwedi-le-bjana.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "thuto-ya-khuru": () =>
    import("@/curriculum/stories/sepedi-home-language/thuto-ya-khuru.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "tindzuwa-na-nhwanyana": () =>
    import("@/curriculum/stories/xitsonga-home-language/tindzuwa-na-nhwanyana.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "indvuku-na-manja": () =>
    import("@/curriculum/stories/siswati-home-language/indvuku-na-manja.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "tshifhiwo-na-phalaphala": () =>
    import("@/curriculum/stories/tshivenda-home-language/tshifhiwo-na-phalaphala.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
  "inkabi-nengwenya": () =>
    import("@/curriculum/stories/isi-ndebele-home-language/inkabi-nengwenya.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  ukukhuthala: () =>
    import("@/curriculum/stories/isi-ndebele-home-language/ukukhuthala.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "die-mooi-rivier": () =>
    import("@/curriculum/stories/afrikaans-home-language/die-mooi-rivier.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  umusa: () =>
    import("@/curriculum/stories/isi-zulu-home-language/umusa.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  ubuntu: () =>
    import("@/curriculum/stories/isi-xhosa-home-language/ubuntu.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "tau-le-noka": () =>
    import("@/curriculum/stories/sepedi-home-language/tau-le-noka.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  botsalano: () =>
    import("@/curriculum/stories/setswana-home-language/botsalano.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  hlompho: () =>
    import("@/curriculum/stories/sesotho-home-language/hlompho.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  nhluvuko: () =>
    import("@/curriculum/stories/xitsonga-home-language/nhluvuko.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  ubuntfu: () =>
    import("@/curriculum/stories/siswati-home-language/ubuntfu.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  vhufunzi: () =>
    import("@/curriculum/stories/tshivenda-home-language/vhufunzi.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "outa-karels-stories": () =>
    import("@/curriculum/stories/english-home-language/outa-karels-stories.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "reynard-fox-south-africa": () =>
    import("@/curriculum/stories/english-home-language/reynard-fox-south-africa.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
  "thoughts-on-south-africa": () =>
    import("@/curriculum/stories/english-home-language/thoughts-on-south-africa.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
  "native-life-south-africa": () =>
    import("@/curriculum/stories/english-home-language/native-life-south-africa.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
  "namukurus-bicycle": () =>
    import("@/curriculum/stories/english-home-language/namukurus-bicycle.json").then((m) => ({
      default: m.default as unknown as Story,
    })),
  "ibhayisikili-likanamakuru": () =>
    import("@/curriculum/stories/isi-zulu-home-language/ibhayisikili-likanamakuru.json").then(
      (m) => ({ default: m.default as unknown as Story }),
    ),
};

const META_CONTENT_LANG_MAP: Record<string, string> = {
  "english-home-language": "english-home-language",
  "afrikaans-home-language": "afrikaans-home-language",
  "isi-zulu-home-language": "isi-zulu-home-language",
  "isi-xhosa-home-language": "isi-xhosa-home-language",
  "sesotho-home-language": "sesotho-home-language",
  "setswana-home-language": "setswana-home-language",
  "sepedi-home-language": "sepedi-home-language",
  "xitsonga-home-language": "xitsonga-home-language",
  "siswati-home-language": "siswati-home-language",
  "tshivenda-home-language": "tshivenda-home-language",
  "isi-ndebele-home-language": "isi-ndebele-home-language",
};

let metasCache: StoryMeta[] | null = null;
const metasByLang: Record<string, StoryMeta[]> = {};
let metasById: Record<string, StoryMeta> = {};
let metasLoaded = false;

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
  metasById = {};
  for (const meta of all) {
    metasById[meta.id] = meta;
  }
  metasLoaded = true;
  return all;
}

export async function loadStoryContent(id: string): Promise<Story | null> {
  if (!metasLoaded) await getAllStoryMetas();

  const staticLoader = STORY_CONTENT_IMPORTS[id];
  if (staticLoader) {
    try {
      const mod = await staticLoader();
      return mod.default as Story;
    } catch {
      return null;
    }
  }

  const meta = metasById[id];
  if (!meta) return null;

  const langDir = META_CONTENT_LANG_MAP[meta.languageId];
  if (!langDir) return null;

  try {
    const mod = await import(`@/curriculum/stories/${langDir}/${id}.json`);
    return mod.default as unknown as Story;
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
