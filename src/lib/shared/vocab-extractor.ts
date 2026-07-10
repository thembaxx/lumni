const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "be",
  "been",
  "being",
  "have",
  "has",
  "had",
  "do",
  "does",
  "did",
  "will",
  "would",
  "can",
  "could",
  "should",
  "may",
  "might",
  "shall",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "they",
  "them",
  "their",
  "we",
  "us",
  "our",
  "you",
  "your",
  "he",
  "she",
  "him",
  "her",
  "his",
  "not",
  "no",
  "nor",
  "so",
  "if",
  "than",
  "then",
  "just",
  "also",
  "very",
  "too",
  "about",
  "up",
  "out",
  "all",
  "each",
  "every",
  "both",
  "few",
  "more",
  "most",
  "some",
  "any",
  "into",
  "over",
  "such",
  "only",
  "other",
  "what",
  "which",
  "who",
  "whom",
  "when",
  "where",
  "why",
  "how",
  "here",
  "there",
]);

const WORD_RE = /[A-Za-z]{4,}/g;

const LEADING_TRAILING_PUNCT = /^[^A-Za-z]+|[^A-Za-z]+$/g;

export function extractVocabularyCandidates(text: string, maxWords = 8): string[] {
  const raw = text.match(WORD_RE);
  if (!raw) return [];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const word of raw) {
    const clean = word.replace(LEADING_TRAILING_PUNCT, "").toLowerCase();
    if (!clean || clean.length < 4 || STOP_WORDS.has(clean) || seen.has(clean)) continue;
    if (/^\d+$/.test(clean)) continue;
    seen.add(clean);
    result.push(clean);
    if (result.length >= maxWords) break;
  }

  return result;
}
