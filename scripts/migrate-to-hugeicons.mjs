#!/usr/bin/env node
/**
 * Migrate phosphor-icons, lucide-react, and @iconify/react to @hugeicons/core-free-icons.
 *
 * Steps:
 *   1. Replace import paths
 *   2. Rename icon specifiers per mapping table (scoped to import lines)
 *   3. Wrap icon JSX elements with <HugeiconsIcon icon={Name} />
 *   4. Add HugeiconsIcon import where needed
 *   5. Handle type/value imports of `Icon` (from phosphor)
 *
 * Usage: node scripts/migrate-to-hugeicons.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---------------------------------------------------------------------------
// Load mapping table
// ---------------------------------------------------------------------------
const raw = JSON.parse(readFileSync(join(__dirname, "phosphor-to-hugeicons.json"), "utf-8"));
const iconMap = {};
for (const [k, v] of Object.entries(raw)) {
  if (!k.startsWith("__")) iconMap[k] = v;
}

// Sort mapping keys by length descending to avoid partial-replacement issues
const sortedMappings = Object.entries(iconMap).toSorted(([a], [b]) => b.length - a.length);

// Build set of new icon names for quick lookup
const allNewNames = new Set(Object.values(iconMap));

// Icons that are already used via the HugeiconsIcon wrapper — do NOT touch
const ALREADY_HUGE = [
  "Activity02Icon",
  "ArrowDown01FreeIcons",
  "ArrowDown01Icon",
  "ArrowLeft01Icon",
  "ArrowRight01Icon",
  "Book02FreeIcons",
  "Book03FreeIcons",
  "BookOpen01Icon",
  "BookOpenCheckFreeIcons",
  "Brain02FreeIcons",
  "Calendar02FreeIcons",
  "Calendar03FreeIcons",
  "Camera01FreeIcons",
  "Cancel01FreeIcons",
  "ChampionIcon",
  "Chat01Icon",
  "CheckmarkCircle01Icon",
  "Delete02FreeIcons",
  "DocumentValidationFreeIcons",
  "Fire02FreeIcons",
  "Home01Icon",
  "Image03FreeIcons",
  "MinusSignFreeIcons",
  "PauseFreeIcons",
  "PlayFreeIcons",
  "PlayIcon",
  "PlusSignFreeIcons",
  "Quiz01Icon",
  "RotateClockwiseFreeIcons",
  "Settings01Icon",
  "Target01Icon",
  "Task01Icon",
];
for (const n of ALREADY_HUGE) allNewNames.add(n);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const OLD_SOURCES = ["@phosphor-icons/react", "lucide-react", "@iconify/react"];
const HUGE_CORE = "@hugeicons/core-free-icons";
const HUGE_REACT = "@hugeicons/react";

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectFiles(dir) {
  const results = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (["node_modules", ".next", "scripts"].includes(entry.name)) continue;
      results.push(...collectFiles(full));
    } else if (entry.isFile() && /\.(tsx?)$/.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

// Check if a line is an import statement from a given source
function isImportFrom(line, source) {
  return /^\s*import\b/.test(line) && line.includes(`"${source}"`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const allFiles = collectFiles(ROOT);
let scanned = 0;
let changed = 0;
let errors = 0;
const manualReviewFiles = new Set();

for (const filePath of allFiles) {
  try {
    let content = readFileSync(filePath, "utf-8");

    // Skip files with no old-style icon imports
    const hasOldImport = OLD_SOURCES.some(
      (s) => content.includes(`"${s}"`) || content.includes(`'${s}'`),
    );
    if (!hasOldImport) continue;

    scanned++;
    const lines = content.split("\n");
    let modified = false;

    // ── Step 1: Replace import paths (per-line so we can track which
    //    lines are "our" import lines after the rename) ────────────
    for (let i = 0; i < lines.length; i++) {
      for (const src of OLD_SOURCES) {
        const origLine = lines[i];
        lines[i] = lines[i].replaceAll(`"${src}"`, `"${HUGE_CORE}"`);
        lines[i] = lines[i].replaceAll(`'${src}'`, `'${HUGE_CORE}'`);
        if (lines[i] !== origLine) modified = true;
      }
    }

    // ── Step 2: Handle `Icon` type/value import from phosphor ─────
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // type import: import type { Icon } from "@hugeicons/core-free-icons"
      const typeMatch = line.match(
        /import\s+type\s*\{\s*Icon\s*\}\s*from\s*["']@hugeicons\/core-free-icons["']/,
      );
      if (typeMatch) {
        lines[i] = line.replace(
          typeMatch[0],
          `import type { IconSvgElement } from "${HUGE_REACT}"`,
        );
        manualReviewFiles.add(filePath);
        modified = true;
        continue;
      }

      // value import of bare `Icon` (not part of icon mapping):
      // import { Icon } from "..." or import { Foo, Icon } from "..."
      if (isImportFrom(line, HUGE_CORE) && /\bIcon\b/.test(line)) {
        // Remove `Icon` from import specifiers
        let newLine = line
          .replace(/,\s*\bIcon\b/g, "") // , Icon → ""
          .replace(/\bIcon\b\s*,/g, "") // Icon, → ""
          .replace(/\bIcon\b/g, ""); // standalone Icon → ""
        // Clean up empty braces
        newLine = newLine.replace(/\{\s*\}/g, "").trim();
        if (newLine.startsWith("import") && !newLine.includes("{")) {
          // Entire import line now empty — remove it
          lines[i] = "";
        } else {
          lines[i] = newLine;
        }
        manualReviewFiles.add(filePath);
        modified = true;
      }
    }

    // ── Step 3: Rename icon specifiers (scoped to import lines) ───
    // First, find which icon names appear in the file
    const usedMappings = [];
    for (const [oldName, newName] of sortedMappings) {
      if (oldName === newName) continue;
      // Check if name appears as a standalone identifier (not inside a longer word)
      const re = new RegExp(`(?<![\\w'"])${escapeRegex(oldName)}(?![\\w'"])`);
      if (re.test(content)) {
        usedMappings.push([oldName, newName]);
      }
    }

    if (usedMappings.length === 0 && !modified) continue;

    // Apply renames:
    //   - Inside import lines only (line-by-line, careful about boundaries)
    //   - In JSX tags (file-wide, safe because of leading `<`)
    //   - As standalone identifiers (file-wide, with word boundary)
    for (const [oldName, newName] of usedMappings) {
      const eOld = escapeRegex(oldName);

      // 3a: Rename inside import lines that import from HUGE_CORE
      for (let i = 0; i < lines.length; i++) {
        if (!isImportFrom(lines[i], HUGE_CORE)) continue;
        const orig = lines[i];
        // Use word boundary to avoid matching inside longer identifiers
        lines[i] = lines[i].replace(new RegExp(`\\b${eOld}\\b`, "g"), newName);
        if (lines[i] !== orig) modified = true;
      }

      // Re-join for file-wide transforms
      content = lines.join("\n");

      // 3b: Rename JSX opening tags: <OldName → <NewName
      const jsxBefore = content;
      content = content.replace(new RegExp(`<${eOld}(?=[\\s/>])`, "g"), `<${newName}`);

      // 3c: Rename JSX closing tags: </OldName> → </NewName>
      content = content.replace(new RegExp(`</${eOld}>`, "g"), `</${newName}>`);

      // 3d: Rename standalone identifier references: {OldName} → {NewName}
      content = content.replace(new RegExp(`(?<![\\w'"])${eOld}(?![\\w'"])`, "g"), newName);

      if (content !== jsxBefore) modified = true;

      // Re-split for next iteration
      lines.length = 0;
      lines.push(...content.split("\n"));
    }

    // Re-join for remaining steps
    content = lines.join("\n");

    // ── Step 4: Add HugeiconsIcon import if needed ────────────────
    const usedNewNames = usedMappings.map(([, n]) => n);
    const willNeedWrapper = usedNewNames.some(
      (n) => allNewNames.has(n) && (content.includes(`<${n}`) || content.includes(`<${n}>`)),
    );

    if (
      willNeedWrapper &&
      !content.includes(`"${HUGE_REACT}"`) &&
      !content.includes(`'${HUGE_REACT}'`)
    ) {
      const fileLines = content.split("\n");
      let insertAt = -1;
      for (let i = fileLines.length - 1; i >= 0; i--) {
        if (fileLines[i].includes(HUGE_CORE)) {
          insertAt = i + 1;
          break;
        }
      }
      if (insertAt === -1) {
        for (let i = 0; i < fileLines.length; i++) {
          if (fileLines[i].startsWith("import ")) {
            insertAt = i + 1;
            break;
          }
        }
      }
      if (insertAt > -1) {
        fileLines.splice(insertAt, 0, `import { HugeiconsIcon } from "${HUGE_REACT}";`);
        content = fileLines.join("\n");
        modified = true;
      }
    }

    // ── Step 5: Wrap icon JSX elements with HugeiconsIcon ─────────
    const hasWrapper =
      content.includes("HugeiconsIcon") &&
      (content.includes(`"${HUGE_REACT}"`) || content.includes(`'${HUGE_REACT}'`));

    if (hasWrapper && usedNewNames.length > 0) {
      for (const [, newName] of usedMappings) {
        if (!allNewNames.has(newName)) continue;
        const was = content;
        // Wrap opening tags
        content = content.replace(
          new RegExp(`<${escapeRegex(newName)}(?=[\\s/>])`, "g"),
          `<HugeiconsIcon icon={${newName}}`,
        );
        // Strip closing tags
        content = content.replace(new RegExp(`</${escapeRegex(newName)}>`, "g"), "");
        if (content !== was) modified = true;
      }
    }

    // ── Write back if changed ─────────────────────────────────────
    if (modified) {
      writeFileSync(filePath, content, "utf-8");
      changed++;
      const rel = filePath.startsWith(ROOT) ? filePath.slice(ROOT.length + 1) : filePath;
      process.stdout.write(`  UPDATED  ${rel}\n`);
    }
  } catch (err) {
    process.stderr.write(`  ERROR    ${filePath}: ${err.message}\n`);
    errors++;
  }
}

// ── Summary ───────────────────────────────────────────────────────
process.stdout.write("\n");
process.stdout.write("═════════════════════════════════════════════\n");
process.stdout.write(`  Scanned:     ${scanned}\n`);
process.stdout.write(`  Changed:     ${changed}\n`);
process.stdout.write(`  Errors:      ${errors}\n`);
process.stdout.write("═════════════════════════════════════════════\n");

if (manualReviewFiles.size > 0) {
  process.stdout.write("\n⚠  Manual review needed:\n");
  for (const f of manualReviewFiles) {
    process.stdout.write(`   - ${f.slice(ROOT.length + 1)}\n`);
  }
}

process.exit(errors > 0 ? 1 : 0);
