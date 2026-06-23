/**
 * Story ingestion seed script.
 *
 * Fetches stories from Project Gutenberg and African Storybook,
 * formats them into the Story JSON schema, and writes to
 * src/curriculum/stories/{language}/.
 *
 * Usage: bun run scripts/ingest-stories.ts
 */

import * as fs from "node:fs";
import * as path from "node:path";

const STORIES_DIR = path.resolve(__dirname, "../src/curriculum/stories");

interface RawStory {
  id: string;
  title: string;
  author: string;
  language: string;
  languageId: string;
  content: string;
  source: "african-storybook" | "project-gutenberg" | "ai-generated";
  sourceUrl?: string;
  license: string;
  gradeLevel: string;
  wordCount: number;
  subjects: string[];
  topics: string[];
}

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

async function fetchProjectGutenbergText(ebookId: string): Promise<string | null> {
  const url = `https://www.gutenberg.org/cache/epub/${ebookId}/pg${ebookId}.txt`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return res.text();
  } catch {
    console.error(`  Failed to fetch PG ebook ${ebookId}`);
    return null;
  }
}

function extractGutenbergContent(raw: string): string {
  // Strip PG header and footer
  const startMarker = "*** START OF";
  const endMarker = "*** END OF";
  const startIdx = raw.indexOf(startMarker);
  const endIdx = raw.indexOf(endMarker, startIdx + 1);

  if (startIdx === -1 || endIdx === -1) return raw;

  const contentStart = raw.indexOf("\n", startIdx) + 1;
  const contentEnd = raw.lastIndexOf("\n", endIdx);
  return raw.slice(contentStart, contentEnd).trim();
}

async function ingestFromProjectGutenberg(): Promise<RawStory[]> {
  const stories: RawStory[] = [];

  const sources: {
    id: string;
    title: string;
    author: string;
    url: string;
    subjects: string[];
    topics: string[];
  }[] = [
    {
      id: "south-african-folk-tales",
      title: "South-African Folk-Tales",
      author: "James A. Honeÿ",
      url: "20753",
      subjects: ["english-home-language", "history"],
      topics: ["literature", "folklore"],
    },
    {
      id: "the-outspan",
      title: "The Outspan: Tales of South Africa",
      author: "Sir James Percy Fitzpatrick",
      url: "73164",
      subjects: ["english-home-language", "history"],
      topics: ["literature", "history"],
    },
    {
      id: "thoughts-on-south-africa",
      title: "Thoughts on South Africa",
      author: "Olive Schreiner",
      url: "35425",
      subjects: ["english-home-language", "history"],
      topics: ["literature", "non-fiction"],
    },
  ];

  for (const source of sources) {
    console.log(`Fetching: ${source.title}...`);
    const raw = await fetchProjectGutenbergText(source.url);
    if (!raw) {
      console.log(`  Skipped (fetch failed)`);
      continue;
    }

    const content = extractGutenbergContent(raw);
    const wordCount = countWords(content);

    stories.push({
      id: source.id,
      title: source.title,
      author: source.author,
      language: "English",
      languageId: "english-home-language",
      content,
      source: "project-gutenberg",
      sourceUrl: `https://www.gutenberg.org/ebooks/${source.url}`,
      license: "public-domain",
      gradeLevel: "10–12",
      wordCount,
      subjects: source.subjects,
      topics: source.topics,
    });
    console.log(`  Done — ${wordCount} words`);
  }

  return stories;
}

async function writeStoryFiles(stories: RawStory[]): Promise<void> {
  for (const story of stories) {
    const langDir = path.join(STORIES_DIR, story.languageId);
    if (!fs.existsSync(langDir)) {
      fs.mkdirSync(langDir, { recursive: true });
    }

    const metaIndexPath = path.join(langDir, "index.ts");
    const storyPath = path.join(langDir, `${story.id}.json`);

    const { subjects, ...storyData } = story;

    // Write JSON
    const jsonContent = {
      ...storyData,
      vocabulary: [],
    };
    fs.writeFileSync(storyPath, JSON.stringify(jsonContent, null, 2));

    // Write or update index.ts
    const metaEntry = `  {\n    id: "${story.id}",\n    title: "${story.title}",\n    author: "${story.author}",\n    language: "${story.language}",\n    languageId: "${story.languageId}",\n    gradeLevel: "${story.gradeLevel}",\n    wordCount: ${story.wordCount},\n    subjects: [${subjects.map((s) => `"${s}"`).join(", ")}],\n    source: "${story.source}",\n    sourceUrl: "${story.sourceUrl ?? ""}",\n    readTimeMinutes: ${Math.ceil(story.wordCount / 200)},\n  }`;

    if (fs.existsSync(metaIndexPath)) {
      let indexContent = fs.readFileSync(metaIndexPath, "utf-8");
      // Replace or append
      const existingMatch = indexContent.match(new RegExp(`id: "${story.id}"`));
      if (!existingMatch) {
        indexContent = indexContent.replace("];", `,\n${metaEntry}\n];`);
        fs.writeFileSync(metaIndexPath, indexContent);
      }
    } else {
      fs.writeFileSync(
        metaIndexPath,
        `import type { StoryMeta } from "@/lib/stories/story-data";\n\nexport const storyMetas: StoryMeta[] = [\n${metaEntry},\n];\n`,
      );
    }

    console.log(`  Wrote: ${storyPath}`);
  }
}

async function main() {
  console.log("=== Story Ingestion ===\n");

  const gutenbergStories = await ingestFromProjectGutenberg();
  await writeStoryFiles(gutenbergStories);

  console.log(`\nDone. Ingested ${gutenbergStories.length} stories.`);
}

main().catch(console.error);
