const GITHUB_API = "https://api.github.com/repos/global-asp/storybooks-saide/contents/stories";
const RAW_BASE = "https://raw.githubusercontent.com/global-asp/storybooks-saide/master/stories";

const LANGUAGE_CODES: Record<string, string> = {
  af: "afrikaans-home-language",
  en: "english-home-language",
  zu: "isi-zulu-home-language",
  xh: "isi-xhosa-home-language",
  st: "sesotho-home-language",
  tn: "setswana-home-language",
  nso: "sepedi-home-language",
  ts: "xitsonga-home-language",
  ss: "siswati-home-language",
  ve: "tshivenda-home-language",
  nr: "isi-ndebele-home-language",
};

const CODE_TO_LABEL: Record<string, string> = {
  af: "Afrikaans",
  en: "English",
  zu: "isiZulu",
  xh: "isiXhosa",
  st: "Sesotho",
  tn: "Setswana",
  nso: "Sepedi",
  ts: "Xitsonga",
  ss: "siSwati",
  ve: "Tshivenda",
  nr: "isiNdebele",
};

const LEVEL_TO_GRADE: Record<string, string> = {
  level1: "R–1",
  level2: "2–4",
  level3: "4–6",
  level4: "7–9",
};

export interface AfricanStoryInfo {
  storyId: string;
  title: string;
  author: string;
  illustrator: string;
  level: string;
  sourceUrl: string;
}

export interface ImportedStory {
  storyId: string;
  languageCode: string;
  languageId: string;
  content: string;
  wordCount: number;
}

function extractMetaFromHtml(html: string): Partial<AfricanStoryInfo> {
  const meta: Partial<AfricanStoryInfo> = {};

  const titleMatch = html.match(/<title>(.+?)<\/title>/);
  if (titleMatch) meta.title = titleMatch[1].replace(/ - Storybooks Saide$/, "").trim();

  const authorMatch = html.match(/Written by<\/span>\s*<\/h3>\s*<h3>([^<]+)/);
  if (authorMatch) meta.author = authorMatch[1].trim();

  const illustratorMatch = html.match(/Illustrated by<\/span>\s*<\/h3>\s*<h3>([^<]+)/);
  if (illustratorMatch) meta.illustrator = illustratorMatch[1].trim();

  const levelMatch = html.match(/\/storybooks-saide\/stories\/[^/]+\/(level\d+)/);
  if (levelMatch) meta.level = levelMatch[1];

  const sourceMatch = html.match(/https:\/\/africanstorybook\.org\/reader\.php\?id=(\d+)/);
  if (sourceMatch) {
    meta.sourceUrl = `https://africanstorybook.org/reader.php?id=${sourceMatch[1]}`;
  }

  return meta;
}

function extractTextFromHtml(html: string, defClass = "def"): string {
  const pages: string[] = [];
  const regex = new RegExp(`class="level2-txt ${defClass}"[^>]*>\\s*<h3>([\\s\\S]*?)<\\/h3>`, "gi");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(html)) !== null) {
    const text = match[1]
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/?[^>]+>/g, "")
      .replace(/&rsquo;/g, "'")
      .replace(/&lsquo;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .trim();
    if (text) pages.push(text);
  }
  return pages.join("\n\n");
}

export function getDefClassForLanguage(langCode: string): string {
  if (langCode === "en") return "def";
  return "l1";
}

function codeToLanguageId(code: string): string {
  return LANGUAGE_CODES[code] ?? `other-${code}`;
}

function codeToLabel(code: string): string {
  return CODE_TO_LABEL[code] ?? code;
}

export async function listAvailableStories(languageCode: string): Promise<{ storyId: string }[]> {
  const res = await fetch(`${GITHUB_API}/${languageCode}`);
  if (!res.ok) return [];
  const entries: { name: string; type: string }[] = await res.json();
  return entries
    .filter((e) => e.type === "dir" && /^\d{4}$/.test(e.name))
    .map((e) => ({
      storyId: e.name,
    }));
}

export async function fetchStoryHtml(
  languageCode: string,
  storyId: string,
): Promise<string | null> {
  const url = `${RAW_BASE}/${languageCode}/${storyId}/index.html`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

export async function importStory(
  languageCode: string,
  storyId: string,
): Promise<{
  info: AfricanStoryInfo;
  content: string;
  wordCount: number;
} | null> {
  const html = await fetchStoryHtml(languageCode, storyId);
  if (!html) return null;

  const meta = extractMetaFromHtml(html);
  const defClass = getDefClassForLanguage(languageCode);
  const content = extractTextFromHtml(html, defClass);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    info: {
      storyId,
      title: meta.title ?? `Story ${storyId}`,
      author: meta.author ?? "African Storybook",
      illustrator: meta.illustrator ?? "Unknown",
      level: meta.level ?? "level2",
      sourceUrl: meta.sourceUrl ?? `https://africanstorybook.org/reader.php?id=${storyId}`,
    },
    content,
    wordCount,
  };
}

export function buildStoryJson(
  imported: NonNullable<Awaited<ReturnType<typeof importStory>>>,
  languageCode: string,
) {
  const languageId = codeToLanguageId(languageCode);
  const gradeLevel = LEVEL_TO_GRADE[imported.info.level] ?? "2–4";
  const id = `${imported.info.storyId}-${languageCode}`;
  const title = imported.info.title;

  return {
    meta: {
      id,
      title,
      author: imported.info.author,
      language: codeToLabel(languageCode),
      languageId,
      gradeLevel,
      wordCount: imported.wordCount,
      subjects: [languageId],
      source: "african-storybook" as const,
      sourceUrl: imported.info.sourceUrl,
      readTimeMinutes: Math.max(1, Math.round(imported.wordCount / 150)),
      topics: ["reading", "literacy"],
      license: "cc-by",
    },
    story: {
      content: imported.content,
      vocabulary: [] as Array<{
        term: string;
        definition: string;
        partOfSpeech: string;
        pronunciation: string;
        language: string;
      }>,
    },
    jsonContent: {
      id,
      title,
      author: imported.info.author,
      language: codeToLabel(languageCode),
      languageId,
      gradeLevel,
      wordCount: imported.wordCount,
      subjects: [languageId],
      source: "african-storybook",
      sourceUrl: imported.info.sourceUrl,
      license: "cc-by",
      readTimeMinutes: Math.max(1, Math.round(imported.wordCount / 150)),
      topics: ["reading", "literacy"],
      content: imported.content,
      vocabulary: [],
    },
  };
}

export async function importAllStoriesForLanguage(languageCode: string): Promise<
  Array<{
    meta: Record<string, unknown>;
    jsonContent: Record<string, unknown>;
  }>
> {
  const available = await listAvailableStories(languageCode);
  const results: Array<{
    meta: Record<string, unknown>;
    jsonContent: Record<string, unknown>;
  }> = [];

  for (const { storyId } of available) {
    const imported = await importStory(languageCode, storyId);
    if (imported) {
      const built = buildStoryJson(imported, languageCode);
      results.push({
        meta: built.meta as unknown as Record<string, unknown>,
        jsonContent: built.jsonContent as unknown as Record<string, unknown>,
      });
    }
  }

  return results;
}
