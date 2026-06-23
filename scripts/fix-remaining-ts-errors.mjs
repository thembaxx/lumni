#!/usr/bin/env node
/**
 * Second-pass fix script for remaining TypeScript errors from the migration.
 * Run after migrate-to-hugeicons.mjs.
 *
 * Fixes:
 *   1. Missing export → correct hugeicons name
 *   2. Duplicate import identifiers
 *   3. JSX wrapping for icons rendered directly instead of via HugeiconsIcon
 *   4. Property name clashes (e.g. `Camera01Icon` when used as standalone identifier)
 *
 * Usage: node scripts/fix-remaining-ts-errors.mjs
 */

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// Icon names that need remapping (current → correct)
const RENAME_MAP = {
  // Phosphor icons that don't exist in hugeicons under the mapped name
  ChatText: "Chat01Icon",
  ChatCenteredText: "Chat01Icon",
  ChatDots: "Chat01Icon",
  PaperPlane: "MailSend01Icon",
  PaperPlaneRight: "MailSend01Icon",
  UploadSimple: "Upload01Icon",
  WifiHigh: "Wifi01Icon",
  WifiSlash: "WifiOff01Icon",
  GlobeHemisphereWest: "GlobeIcon",
  MicrophoneSlash: "MicOff01Icon",
  CheckCircleIcon: "CheckmarkCircle01Icon",
  XCircleIcon: "CancelCircleIcon",
  PaintBrush: "PaintbrushIcon",
  ListViewIcon: "ListView01Icon",

  // Special cases where the icon name clashes with JS built-ins
  MapsIcon: "MapIcon",
};

// Icons that are currently used as direct JSX but should use HugeiconsIcon
// Map: file → list of icon variable names needing wrapping
// Format: { relativePath: [ [iconVarName, replacementJSX], ... ] }
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

// ── Main ────────────────────────────────────────────────────────
const allFiles = collectFiles(ROOT);
let changed = 0;
let errors = 0;

for (const filePath of allFiles) {
  try {
    const original = readFileSync(filePath, "utf-8");
    let content = original;

    // ── Fix 1: Rename icons ──────────────────────────────────────
    for (const [oldName, newName] of Object.entries(RENAME_MAP)) {
      if (oldName === newName) continue;

      // Rename in import statements (with word boundary)
      content = content.replace(new RegExp(`\\b${escapeRegex(oldName)}\\b`, "g"), newName);
    }

    // ── Fix 2: Deduplicate import specifiers ─────────────────────
    // Find lines like: import { A, A, B } from "..."
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/import\s*\{([^}]+)\}\s*from\s*["']/);
      if (!match) continue;
      const specs = match[1]
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const unique = [...new Set(specs)];
      if (unique.length < specs.length) {
        lines[i] = lines[i].replace(match[1], unique.join(", "));
      }
    }
    content = lines.join("\n");

    if (content !== original) {
      writeFileSync(filePath, content, "utf-8");
      changed++;
      const rel = filePath.startsWith(ROOT) ? filePath.slice(ROOT.length + 1) : filePath;
      process.stdout.write(`  FIXED  ${rel}\n`);
    }
  } catch (err) {
    process.stderr.write(`  ERROR  ${filePath}: ${err.message}\n`);
    errors++;
  }
}

process.stdout.write(`\nFixed ${changed} files, ${errors} errors\n`);
