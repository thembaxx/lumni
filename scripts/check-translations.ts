import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

interface FlatEntry {
  key: string;
  value: string;
}

function flatten(obj: Record<string, unknown>, prefix = ""): FlatEntry[] {
  const entries: FlatEntry[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) {
      entries.push(...flatten(v as Record<string, unknown>, key));
    } else {
      entries.push({ key, value: String(v ?? "") });
    }
  }
  return entries;
}

function unflatten(entries: FlatEntry[]): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  for (const { key, value } of entries) {
    const parts = key.split(".");
    let current = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) current[part] = {};
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }
  return root;
}

const messagesDir = join(import.meta.dirname, "..", "messages");

const locales = ["af", "zu", "xh", "st", "tn", "nso", "ts", "ss", "ve", "nd"];

const enRaw = JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf-8")) as Record<
  string,
  unknown
>;
const enEntries = flatten(enRaw);
const enMap = new Map(enEntries.map((e) => [e.key, e.value]));

interface MissingInfo {
  loc: string;
  key: string;
  value: string;
}

const allMissing: MissingInfo[] = [];

for (const loc of locales) {
  const path = join(messagesDir, `${loc}.json`);
  if (!existsSync(path)) {
    console.log(`${loc}: FILE MISSING`);
    continue;
  }
  const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  const entries = flatten(raw);
  const locMap = new Map(entries.map((e) => [e.key, e.value]));

  const missing: { key: string; value: string }[] = [];
  for (const [key, enVal] of enMap) {
    const locVal = locMap.get(key);
    if (!locVal || locVal === enVal) {
      missing.push({ key, value: enVal });
    }
  }

  for (const m of missing) {
    allMissing.push({ loc, ...m });
  }

  const pct = enMap.size > 0 ? Math.round((missing.length / enMap.size) * 100) : 0;
  const total = enMap.size - missing.length;
  console.log(`${loc}: ${total}/${enMap.size} translated (${pct}% missing)`);
}

console.log(`\nTotal missing translations across all locales: ${allMissing.length}`);
