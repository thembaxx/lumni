import { readFileSync, existsSync } from "node:fs";
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

const messagesDir = join(import.meta.dirname, "..", "messages");

const TARGET_LOCALES = ["af", "zu", "xh", "st", "tn", "nso", "ts", "ss", "ve", "nd"];

const LOCALE_NAMES: Record<string, string> = {
  af: "Afrikaans",
  zu: "isiZulu",
  xh: "isiXhosa",
  st: "Sesotho",
  tn: "Setswana",
  nso: "Sepedi",
  ts: "Xitsonga",
  ss: "Siswati",
  ve: "Tshivenda",
  nd: "isiNdebele",
};

const enRaw = JSON.parse(readFileSync(join(messagesDir, "en.json"), "utf-8")) as Record<
  string,
  unknown
>;
const enFlat = flatten(enRaw);
const enMap = new Map(enFlat.map((e) => [e.key, e.value]));

const BATCH_SIZE = 25;

interface Chunk {
  locale: string;
  keys: string[];
  values: string[];
}

const chunks: Chunk[] = [];

for (const loc of TARGET_LOCALES) {
  const path = join(messagesDir, `${loc}.json`);
  if (!existsSync(path)) {
    console.error(`${loc}: file not found, skipping`);
    continue;
  }

  const raw = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>;
  const locFlat = flatten(raw);
  const locMap = new Map(locFlat.map((e) => [e.key, e.value]));
  const name = LOCALE_NAMES[loc];

  const toTranslate: { key: string; value: string }[] = [];
  for (const [key, enVal] of enMap) {
    const locVal = locMap.get(key);
    if (!locVal || locVal === enVal) {
      toTranslate.push({ key, value: enVal });
    }
  }

  for (let i = 0; i < toTranslate.length; i += BATCH_SIZE) {
    const batch = toTranslate.slice(i, i + BATCH_SIZE);
    chunks.push({
      locale: loc,
      keys: batch.map((t) => t.key),
      values: batch.map((t) => t.value),
    });
  }

  const pct = enMap.size > 0 ? Math.round((toTranslate.length / enMap.size) * 100) : 0;
  console.log(`${name} (${loc}): ${toTranslate.length} missing (${pct}% of total)`);
}

console.log(`\nTotal chunks to translate: ${chunks.length}`);
console.log("Run each chunk through your preferred AI provider with this prompt template:\n");

for (const chunk of chunks.slice(0, 3)) {
  const name = LOCALE_NAMES[chunk.locale];
  const lines = chunk.keys.map((k, i) => `${k}: ${JSON.stringify(chunk.values[i])}`);
  console.log(`--- ${name} (${chunk.locale}) batch of ${chunk.keys.length} ---`);
  console.log(
    `Translate these ${name} UI strings. Return ONLY a JSON object matching the input structure with translated values:\n${lines.join("\n")}`,
  );
  console.log();
}
