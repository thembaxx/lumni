import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Each FAL maps to its corresponding home-language story collection
// Story IDs come from the HL index.ts (same language, same stories)
const FAL_TO_HL = {
  "afrikaans-first-additional-language": { hl: "afrikaans-home-language", literal: "afr-fal-literal", inferential: "afr-fal-inferential", shortStories: "afr-fal-short-stories" },
  "english-first-additional-language": { hl: "english-home-language", literal: "eng-fal-literal", inferential: "eng-fal-inferential", shortStories: "eng-fal-short-stories" },
  "isi-xhosa-first-additional-language": { hl: "isi-xhosa-home-language", literal: "xho-fal-literal", inferential: "xho-fal-inferential", shortStories: "xho-fal-short-stories" },
  "isi-zulu-first-additional-language": { hl: "isi-zulu-home-language", literal: "zul-fal-literal", inferential: "zul-fal-inferential", shortStories: "zul-fal-short-stories" },
  "sepedi-first-additional-language": { hl: "sepedi-home-language", literal: "nso-fal-literal", inferential: "nso-fal-inferential", shortStories: "nso-fal-short-stories" },
  "sesotho-first-additional-language": { hl: "sesotho-home-language", literal: "sot-fal-literal", inferential: "sot-fal-inferential", shortStories: "sot-fal-short-stories" },
  "setswana-first-additional-language": { hl: "setswana-home-language", literal: "tsn-fal-literal", inferential: "tsn-fal-inferential", shortStories: "tsn-fal-short-stories" },
};

function loadHLStoryIds(langId) {
  const indexPath = join(root, "src", "curriculum", "stories", langId, "index.ts");
  if (!existsSync(indexPath)) return [];
  const content = readFileSync(indexPath, "utf-8");
  const ids = [];
  const blocks = content.split(/\n\s*\{/).slice(1);
  for (const block of blocks) {
    const idMatch = block.match(/id:\s*"([^"]+)"/);
    const sourceMatch = block.match(/source:\s*"([^"]+)"/);
    const gradeMatch = block.match(/gradeLevel:\s*"([^"]+)"/);
    if (idMatch && sourceMatch && sourceMatch[1] === "african-storybook") {
      ids.push({ id: idMatch[1], gradeLevel: gradeMatch ? gradeMatch[1] : null });
    }
  }
  return ids;
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

function addToSubtopic(curriculum, subtopicId, storyIds) {
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
        return storyIds.length;
      }
    }
  }
  return -1;
}

for (const [falFile, config] of Object.entries(FAL_TO_HL)) {
  const curriculumPath = join(root, "src", "curriculum", `${falFile}.json`);
  if (!existsSync(curriculumPath)) {
    console.log(`${falFile}: not found`);
    continue;
  }

  const stories = loadHLStoryIds(config.hl);
  if (stories.length === 0) {
    console.log(`${falFile}: no stories for HL '${config.hl}'`);
    continue;
  }

  const byBucket = { foundation: [], intermediate: [], senior: [] };
  for (const s of stories) {
    byBucket[gradeBucket(s.gradeLevel)].push(s.id);
  }

  let curriculum = JSON.parse(readFileSync(curriculumPath, "utf-8"));

  const literalCount = addToSubtopic(curriculum, config.literal, [...byBucket.foundation, ...byBucket.intermediate]);
  const inferentialCount = addToSubtopic(curriculum, config.inferential, byBucket.senior);
  const shortCount = addToSubtopic(curriculum, config.shortStories, byBucket.foundation.slice(0, 3));

  writeFileSync(curriculumPath, JSON.stringify(curriculum, null, 2) + "\n", "utf-8");

  const status = [];
  if (literalCount > 0) status.push(`literal:${literalCount}`);
  if (inferentialCount > 0) status.push(`inferential:${inferentialCount}`);
  if (shortCount > 0) status.push(`short:${shortCount}`);

  console.log(`${falFile}: ${status.join(", ")} (from ${config.hl})`);
}

console.log("\nDone!");
