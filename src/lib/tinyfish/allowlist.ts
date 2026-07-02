import { logError } from "@/lib/shared/logger";

// Keep in sync with src/curriculum/index.ts — all 44 CAPS subjects
export const ALLOWED_SUBJECTS: readonly string[] = [
  "accounting",
  "afrikaans-first-additional-language",
  "afrikaans-home-language",
  "agricultural-management-practices",
  "agricultural-sciences",
  "agricultural-technology",
  "business-studies",
  "civil-technology",
  "computer-applications-technology",
  "consumer-studies",
  "dance-studies",
  "design",
  "dramatic-arts",
  "economics",
  "electrical-technology",
  "engineering-graphics-and-design",
  "english-first-additional-language",
  "english-home-language",
  "geography",
  "history",
  "hospitality-studies",
  "information-technology",
  "isi-ndebele-home-language",
  "isi-xhosa-first-additional-language",
  "isi-xhosa-home-language",
  "isi-zulu-first-additional-language",
  "isi-zulu-home-language",
  "life-orientation",
  "life-sciences",
  "mathematical-literacy",
  "mathematics",
  "mechanical-technology",
  "music",
  "physical-sciences",
  "religion-studies",
  "sepedi-first-additional-language",
  "sepedi-home-language",
  "sesotho-first-additional-language",
  "sesotho-home-language",
  "setswana-first-additional-language",
  "setswana-home-language",
  "si-swati-home-language",
  "technical-mathematics",
  "technical-sciences",
  "tourism",
  "tshivenda-home-language",
  "visual-arts",
  "xitsonga-home-language",
];

const ALLOWED_SET = new Set(ALLOWED_SUBJECTS);

export function isSubjectAllowed(subject: string | undefined | null): boolean {
  if (!subject) return false;
  return ALLOWED_SET.has(subject);
}

export const BLOCKED_DOMAINS: readonly string[] = [
  "pinterest.com",
  "reddit.com",
  "x.com",
  "twitter.com",
  "quora.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "youtube.com",
];

const BLOCKED_SET = new Set(BLOCKED_DOMAINS);

export function isDomainBlocked(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    for (const blocked of BLOCKED_SET) {
      if (hostname === blocked || hostname.endsWith(`.${blocked}`)) {
        return true;
      }
    }
    return false;
  } catch (err) {
    logError("TinyFishAllowlist", err);
    return true;
  }
}

export const MIN_CONTENT_LENGTH = 200;
export const MAX_SOURCE_CONTENT_CHARS = 1500;
export const DEFAULT_SEARCH_RESULTS = 3;
export const DEFAULT_FETCH_MAX_CHARS = 5000;
export const REQUEST_TIMEOUT_MS = 3000;
export const GENERATE_CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const SOLVE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
export const PER_USER_DAILY_LIMIT = 20;
