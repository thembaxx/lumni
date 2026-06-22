import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

dotenv.config({ path: resolve(__dirname, "..", ".env.local") });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite-001:generateContent";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

const LOCALES = {
  zu: "isiZulu",
  xh: "isiXhosa",
  st: "Sesotho",
  tn: "Setswana",
  nso: "Sepedi",
  ts: "Xitsonga",
  ss: "SiSwati",
  ve: "Tshivenda",
  nd: "isiNdebele",
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGemini(prompt) {
  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192, topP: 0.95 },
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw { status: response.status, body: error };
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
}

async function callGroq(prompt) {
  const messages = [
    {
      role: "system",
      content:
        "You are a professional translator. Return ONLY valid JSON — no explanation, no markdown, no code fences.",
    },
    { role: "user", content: prompt },
  ];
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages,
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw { status: response.status, body: error };
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callNvidia(prompt) {
  const messages = [
    {
      role: "system",
      content:
        "You are a professional translator. Return ONLY valid JSON — no explanation, no markdown, no code fences.",
    },
    { role: "user", content: prompt },
  ];
  const response = await fetch(NVIDIA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${NVIDIA_API_KEY}` },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages,
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });
  if (!response.ok) {
    const error = await response.text();
    throw { status: response.status, body: error };
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAI(prompt, label) {
  const providers = [];
  if (GEMINI_API_KEY) providers.push({ name: "Gemini", fn: () => callGemini(prompt) });
  if (GROQ_API_KEY) providers.push({ name: "Groq", fn: () => callGroq(prompt) });
  if (NVIDIA_API_KEY) providers.push({ name: "Nvidia", fn: () => callNvidia(prompt) });

  for (const provider of providers) {
    try {
      const text = await provider.fn();
      console.log(`    ${label}: used ${provider.name}`);
      return text;
    } catch (err) {
      const msg = `${err.status || ""} ${err.body || err.message || ""}`.trim();
      console.warn(`    ${label}: ${provider.name} failed (${msg})`);
    }
  }
  throw new Error(`All providers failed for ${label}`);
}

function extractJson(text) {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("No JSON found in response");
  return match[0];
}

async function translateSection(sourceSection, sectionName, targetLang, languageName) {
  const prompt = `Translate the following JSON object from English to ${languageName} (${targetLang}). 

RULES:
- Preserve ALL keys exactly as-is
- Preserve ALL ICU variables like {variableName} and plural syntax like {count, plural, one {...} other {...}}
- Only translate the string VALUES, not the keys
- Return ONLY valid JSON — no explanation, no markdown, no code fences

Source (namespace: ${sectionName}):
${JSON.stringify(sourceSection, null, 2)}`;

  const raw = await callAI(prompt, `${languageName}/${sectionName}`);
  return JSON.parse(extractJson(raw));
}

async function translateLanguage(locale, languageName, enSource) {
  console.log(`\n${languageName} (${locale}):`);
  const result = {};

  // process sections sequentially to avoid rate limits
  const sections = Object.keys(enSource);
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    const sourceSection = enSource[section];

    if (
      typeof sourceSection === "object" &&
      sourceSection !== null &&
      !Array.isArray(sourceSection)
    ) {
      try {
        result[section] = await translateSection(sourceSection, section, locale, languageName);
      } catch (err) {
        console.warn(`    ${section}: failed — ${err.message}`);
        result[section] = sourceSection; // fallback to English
      }
    } else {
      result[section] = sourceSection;
    }

    // delay between sections to avoid rate limits
    if (i < sections.length - 1) {
      await sleep(3000);
    }
  }

  const outPath = resolve(ROOT, "messages", `${locale}.json`);
  writeFileSync(outPath, JSON.stringify(result, null, 2) + "\n");
  console.log(`  ✅ Written to messages/${locale}.json`);
}

async function fillAfrikaansGaps(enSource, afPath) {
  console.log("\nFilling Afrikaans (af) gaps...");
  const afSource = JSON.parse(readFileSync(afPath, "utf-8"));

  // Find missing keys
  const missingKeys = {};
  for (const [section, content] of Object.entries(enSource)) {
    if (typeof content === "object" && content !== null) {
      if (!afSource[section]) {
        missingKeys[section] = content;
      } else {
        for (const key of Object.keys(content)) {
          if (!(key in afSource[section])) {
            if (!missingKeys[section]) missingKeys[section] = {};
            missingKeys[section][key] = content[key];
          }
        }
      }
    }
  }

  const totalMissing = Object.values(missingKeys).reduce(
    (sum, v) => sum + (typeof v === "object" ? Object.keys(v).length : 1),
    0,
  );

  if (totalMissing === 0) {
    console.log("  ✅ No missing keys found");
    return;
  }

  console.log(`  Found ~${totalMissing} missing keys`);

  // Translate each missing section
  for (const [section, content] of Object.entries(missingKeys)) {
    const prompt = `Translate this JSON from English to Afrikaans. Preserve all keys exactly. Return ONLY valid JSON.

Source:
${JSON.stringify(content, null, 2)}`;

    try {
      const raw = await callAI(prompt, `af/${section}`);
      const translated = JSON.parse(extractJson(raw));
      if (!afSource[section]) afSource[section] = {};
      Object.assign(afSource[section], translated);
      console.log(`    af/${section}: translated`);
    } catch (err) {
      console.warn(`    af/${section}: failed — ${err.message}`);
      if (!afSource[section]) afSource[section] = {};
      Object.assign(afSource[section], content); // fallback to English
    }
    await sleep(2000);
  }

  writeFileSync(afPath, JSON.stringify(afSource, null, 2) + "\n");
  console.log("  ✅ Written to messages/af.json");
}

async function main() {
  const enPath = resolve(ROOT, "messages", "en.json");
  const afPath = resolve(ROOT, "messages", "af.json");
  const enSource = JSON.parse(readFileSync(enPath, "utf-8"));

  console.log("Starting translation generation...");
  console.log(`Source: ${Object.keys(enSource).length} sections`);
  if (!GEMINI_API_KEY) console.log("Gemini: not configured");
  if (!GROQ_API_KEY) console.log("Groq: not configured");
  if (!NVIDIA_API_KEY) console.log("Nvidia: not configured");

  // Step 1: Fill Afrikaans gaps
  await fillAfrikaansGaps(enSource, afPath);

  // Step 2: Translate each new language (sequential, with delays)
  const entries = Object.entries(LOCALES);
  for (let i = 0; i < entries.length; i++) {
    const [locale, languageName] = entries[i];
    await translateLanguage(locale, languageName, enSource);
    if (i < entries.length - 1) {
      console.log("  Waiting 10s before next language...");
      await sleep(10000);
    }
  }

  console.log("\n--- Done ---");
}

main().catch(console.error);
