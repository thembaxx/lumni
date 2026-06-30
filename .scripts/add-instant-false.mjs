import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

function findPageFiles(dir, results = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      findPageFiles(full, results);
    } else if (entry.name === "page.tsx") {
      results.push(full);
    }
  }
  return results;
}

const base = "src/app/[locale]";
const files = findPageFiles(base);

let count = 0;
for (const file of files) {
  const content = readFileSync(file, "utf-8");
  if (content.includes("export const instant")) continue;
  const trimmed = content.trimEnd();
  writeFileSync(file, trimmed + "\n\nexport const instant = false;\n");
  console.log("fixed", relative(process.cwd(), file));
  count++;
}
console.log(`\nFixed ${count} files`);
