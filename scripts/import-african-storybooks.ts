/**
 * Bulk import all African Storybook stories across 11 SA languages.
 *
 * Fetches story listing from the GitHub API, imports each story via the
 * african-storybook-importer module, writes JSON files to the curriculum
 * directory, and updates index.ts files.
 *
 * Usage: pnpm exec tsx scripts/import-african-storybooks.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const STORIES_DIR = path.resolve(__dirname, "../src/curriculum/stories");

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

const DEFAULT_READ_TIME_RATIO = 150;

const GITHUB_API = "https://api.github.com/repos/global-asp/storybooks-saide/contents/stories";
const RAW_BASE = "https://raw.githubusercontent.com/global-asp/storybooks-saide/master/stories";

function extractMetaFromHtml(html: string): Record<string, string | undefined> {
  const meta: Record<string, string | undefined> = {};

  const titleMatch = html.match(/<title>(.+?)<\/title>/);
  if (titleMatch) meta.title = titleMatch[1].replace(/ - Storybooks Saide$/, "").trim();

  const authorMatch = html.match(/Written by<\/span>\s*<\/h3>\s*<h3>([^<]+)/);
  if (authorMatch) meta.author = authorMatch[1].trim();

  const levelMatch = html.match(/\/storybooks-saide\/stories\/[^/]+\/(level\d+)/);
  if (levelMatch) meta.level = levelMatch[1];

  const sourceMatch = html.match(/https:\/\/africanstorybook\.org\/reader\.php\?id=(\d+)/);
  if (sourceMatch) {
    meta.sourceUrl = `https://africanstorybook.org/reader.php?id=${sourceMatch[1]}`;
  }

  return meta;
}

function extractTextFromHtml(html: string): string {
  const pages: string[] = [];
  const regex = /class="[^"]*level\d+-txt def"[^>]*>\s*<h3>([\s\S]*?)<\/h3>/gi;
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

async function listAvailableStories(languageCode: string): Promise<string[]> {
  const res = await fetch(`${GITHUB_API}/${languageCode}`);
  if (!res.ok) return [];
  const entries: { name: string; type: string }[] = await res.json();
  return entries.filter((e) => e.type === "dir" && /^\d{4}$/.test(e.name)).map((e) => e.name);
}

async function fetchStoryHtml(languageCode: string, storyId: string): Promise<string | null> {
  const url = `${RAW_BASE}/${languageCode}/${storyId}/index.html`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.text();
}

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function importStory(
  languageCode: string,
  storyId: string,
): Promise<{
  storyId: string;
  title: string;
  author: string;
  level: string;
  sourceUrl: string;
  content: string;
  wordCount: number;
} | null> {
  const html = await fetchStoryHtml(languageCode, storyId);
  if (!html) return null;

  const meta = extractMetaFromHtml(html);
  const content = extractTextFromHtml(html);
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  return {
    storyId,
    title: meta.title ?? `Story ${storyId}`,
    author: meta.author ?? "African Storybook",
    level: meta.level ?? "level2",
    sourceUrl: meta.sourceUrl ?? `https://africanstorybook.org/reader.php?id=${storyId}`,
    content,
    wordCount,
  };
}

async function main() {
  console.log("=== African Storybook Bulk Import ===\n");

  const newStoryDataEntries: string[] = [];

  for (const [code, languageId] of Object.entries(LANGUAGE_CODES)) {
    const langDir = path.join(STORIES_DIR, languageId);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    console.log(`\n--- ${CODE_TO_LABEL[code]} (${code}) ---`);
    const storyIds = await listAvailableStories(code);
    console.log(`  Found ${storyIds.length} stories`);

    if (storyIds.length === 0) continue;

    const indexFilePath = path.join(langDir, "index.ts");
    let indexContent: string | null = null;
    let existingIds = new Set<string>();

    if (fs.existsSync(indexFilePath)) {
      indexContent = fs.readFileSync(indexFilePath, "utf-8");
      const idMatches = indexContent.matchAll(/id:\s+"([^"]+)"/g);
      for (const m of idMatches) existingIds.add(m[1]);
    }

    const importable: Array<{
      slug: string;
      title: string;
      author: string;
      level: string;
      sourceUrl: string;
      content: string;
      wordCount: number;
    }> = [];

    for (const sid of storyIds) {
      const imported = await importStory(code, sid);
      if (!imported) {
        console.log(`  ✗ ${sid} — fetch failed`);
        continue;
      }

      const slug = slugifyTitle(imported.title);
      if (existingIds.has(slug)) {
        console.log(`  - ${slug} — already exists, skipping`);
        continue;
      }

      importable.push({ ...imported, slug });
    }

    if (importable.length === 0) {
      console.log("  No new stories to import");
      continue;
    }

    for (const story of importable) {
      const gradeLevel = LEVEL_TO_GRADE[story.level] ?? "2–4";

      const jsonContent = {
        id: story.slug,
        title: story.title,
        author: story.author,
        language: CODE_TO_LABEL[code],
        languageId,
        gradeLevel,
        wordCount: story.wordCount,
        subjects: [languageId],
        source: "african-storybook" as const,
        sourceUrl: story.sourceUrl,
        license: "cc-by",
        readTimeMinutes: Math.max(1, Math.round(story.wordCount / DEFAULT_READ_TIME_RATIO)),
        topics: ["reading", "literacy"],
        content: story.content,
        vocabulary: [],
      };

      const storyFilePath = path.join(langDir, `${story.slug}.json`);
      fs.writeFileSync(storyFilePath, JSON.stringify(jsonContent, null, 2));
      console.log(`  ✓ ${story.slug} (${story.wordCount} words) → ${story.slug}.json`);

      // Generate story-data.ts entry
      newStoryDataEntries.push(
        `  "${story.slug}": () =>\n    import("@/curriculum/stories/${languageId}/${story.slug}.json").then((m) => ({\n      default: m.default as unknown as Story,\n    })),`,
      );
    }

    // Update index.ts
    const newMetas = importable.map((story) => {
      const gradeLevel = LEVEL_TO_GRADE[story.level] ?? "2–4";
      return `  {\n    id: "${story.slug}",\n    title: "${story.title.replace(/"/g, '\\"')}",\n    author: "${story.author.replace(/"/g, '\\"')}",\n    language: "${CODE_TO_LABEL[code]}",\n    languageId: "${languageId}",\n    gradeLevel: "${gradeLevel}",\n    wordCount: ${story.wordCount},\n    subjects: ["${languageId}"],\n    source: "african-storybook",\n    sourceUrl: "${story.sourceUrl}",\n    readTimeMinutes: ${Math.max(1, Math.round(story.wordCount / DEFAULT_READ_TIME_RATIO))},\n    topics: ["reading", "literacy"],\n    license: "cc-by",\n  }`;
    });

    const metaBlock = newMetas.join(",\n") + ",";

    if (indexContent) {
      indexContent = indexContent.replace(/(\];\s*)$/, `${metaBlock}\n$1`);
      fs.writeFileSync(indexFilePath, indexContent);
    } else {
      const header = `import type { StoryMeta } from "@/lib/stories/story-data";\n\nexport const storyMetas: StoryMeta[] = [\n`;
      fs.writeFileSync(indexFilePath, `${header}${metaBlock}\n];\n`);
    }

    console.log(`  Updated ${languageId}/index.ts (+${importable.length} entries)`);
  }

  console.log("\n\n=== Summary ===");

  if (newStoryDataEntries.length > 0) {
    console.log(`\n${newStoryDataEntries.length} new story files created.`);
    console.log("\nAdd these entries to STORY_CONTENT_IMPORTS in src/lib/stories/story-data.ts:\n");
    console.log(newStoryDataEntries.join("\n\n"));
  } else {
    console.log("No new stories imported — all already exist.");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Import failed:", err);
  process.exit(1);
});
