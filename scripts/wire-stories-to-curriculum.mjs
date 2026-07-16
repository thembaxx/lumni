import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const HOME_LANGS = [
  "afrikaans-home-language",
  "english-home-language",
  "isi-ndebele-home-language",
  "isi-xhosa-home-language",
  "isi-zulu-home-language",
  "sepedi-home-language",
  "sesotho-home-language",
  "setswana-home-language",
  "si-swati-home-language",
  "tshivenda-home-language",
  "xitsonga-home-language",
];

function loadStoryMetas(langId) {
  const indexPath = join(root, "src", "curriculum", "stories", langId, "index.ts");
  if (!existsSync(indexPath)) return [];
  const content = readFileSync(indexPath, "utf-8");
  const metas = [];
  const blocks = content.split(/\n\s*\{/).slice(1);
  for (const block of blocks) {
    const idMatch = block.match(/id:\s*"([^"]+)"/);
    const sourceMatch = block.match(/source:\s*"([^"]+)"/);
    const gradeMatch = block.match(/gradeLevel:\s*"([^"]+)"/);
    if (idMatch && sourceMatch && sourceMatch[1] === "african-storybook") {
      metas.push({ id: idMatch[1], gradeLevel: gradeMatch ? gradeMatch[1] : null });
    }
  }
  return metas;
}

function gradeBucket(gradeLevel) {
  if (!gradeLevel) return "intermediate";
  const m = gradeLevel.match(/^(\d+)/);
  if (!m) return "intermediate";
  const n = parseInt(m[1], 10);
  if (n <= 1) return "foundation";
  if (n <= 6) return "intermediate";
  return "senior";
}

// All home languages use consistent: {prefix}-literal (R-6) / {prefix}-inferential (7-12)
const BUCKET_MAP = {
  "afrikaans-home-language": {
    foundation: "afr-letterlik",
    intermediate: "afr-letterlik",
    senior: "afr-afleidend",
    shortStories: "afr-kortverhale",
  },
  "isi-ndebele-home-language": {
    foundation: "ndb-literal",
    intermediate: "ndb-literal",
    senior: "ndb-inferential",
    shortStories: "ndb-short-stories",
  },
  "isi-xhosa-home-language": {
    foundation: "xho-literal",
    intermediate: "xho-literal",
    senior: "xho-inferential",
    shortStories: "xho-short-stories",
  },
  "isi-zulu-home-language": {
    foundation: "zul-literal",
    intermediate: "zul-literal",
    senior: "zul-inferential",
    shortStories: "zul-short-stories",
  },
  "sepedi-home-language": {
    foundation: "sep-literal",
    intermediate: "sep-literal",
    senior: "sep-inferential",
    shortStories: "sep-short-stories",
  },
  "sesotho-home-language": {
    foundation: "sot-literal",
    intermediate: "sot-literal",
    senior: "sot-inferential",
    shortStories: "sot-short-stories",
  },
  "setswana-home-language": {
    foundation: "tsw-literal",
    intermediate: "tsw-literal",
    senior: "tsw-inferential",
    shortStories: "tsw-short-stories",
  },
  "si-swati-home-language": {
    foundation: "ssw-literal",
    intermediate: "ssw-literal",
    senior: "ssw-inferential",
    shortStories: "ssw-short-stories",
  },
  "tshivenda-home-language": {
    foundation: "ven-literal",
    intermediate: "ven-literal",
    senior: "ven-inferential",
    shortStories: "ven-short-stories",
  },
  "xitsonga-home-language": {
    foundation: "tsg-literal",
    intermediate: "tsg-literal",
    senior: "tsg-inferential",
    shortStories: "tsg-short-stories",
  },
};

for (const langId of HOME_LANGS) {
  if (langId === "english-home-language") {
    console.log(`${langId}: already wired, skipping`);
    continue;
  }

  const curriculumPath = join(root, "src", "curriculum", `${langId}.json`);
  if (!existsSync(curriculumPath)) {
    console.log(`${langId}: no curriculum JSON`);
    continue;
  }

  const stories = loadStoryMetas(langId);
  if (stories.length === 0) {
    console.log(`${langId}: no African Storybook stories`);
    continue;
  }

  const buckets = BUCKET_MAP[langId];
  if (!buckets) {
    console.log(`${langId}: no bucket map`);
    continue;
  }

  const byBucket = { foundation: [], intermediate: [], senior: [], folktales: [] };
  for (const s of stories) {
    const g = gradeBucket(s.gradeLevel);
    // Folktale-style stories go to short stories too
    if (s.id.includes("fox") || s.id.includes("trick") || s.id.includes("king")) {
      byBucket.folktales.push(s.id);
    }
    byBucket[g].push(s.id);
  }

  let curriculum = JSON.parse(readFileSync(curriculumPath, "utf-8"));

  function addToSubtopic(subtopicId, storyIds) {
    if (!storyIds || storyIds.length === 0) return;
    for (const topic of curriculum.topics) {
      for (const st of topic.subtopics) {
        if (st.id === subtopicId) {
          if (!st.stories) st.stories = [];
          const existing = new Set(st.stories);
          for (const sid of storyIds) {
            if (!existing.has(sid)) {
              st.stories.push(sid);
              existing.add(sid);
            }
          }
          console.log(`  ${langId}: +${storyIds.length} → ${subtopicId} (${st.name})`);
          return;
        }
      }
    }
    console.log(`  WARN: subtopic ${subtopicId} not found in ${langId}`);
  }

  addToSubtopic(buckets.foundation, byBucket.foundation);
  addToSubtopic(buckets.intermediate, byBucket.intermediate);
  addToSubtopic(buckets.senior, byBucket.senior);
  addToSubtopic(buckets.shortStories, [...byBucket.folktales, ...byBucket.foundation.slice(0, 3)]);

  writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2) + "\n", "utf-8");
  console.log(`${langId}: done (${stories.length} total stories)`);
}

console.log("\nAll done!");
