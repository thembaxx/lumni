import { logError } from "@/lib/shared/logger";

export const ALLOWED_SUBJECTS: readonly string[] = [
	"mathematics",
	"mathematical-literacy",
	"technical-mathematics",
	"physical-sciences",
	"technical-sciences",
	"life-sciences",
	"agricultural-sciences",
	"agricultural-management-practices",
	"agricultural-technology",
	"geography",
	"history",
	"accounting",
	"economics",
	"business-studies",
	"english-home-language",
	"english-first-additional-language",
	"afrikaans-home-language",
	"afrikaans-first-additional-language",
	"isi-zulu-home-language",
	"isi-zulu-first-additional-language",
	"isi-xhosa-home-language",
	"isi-xhosa-first-additional-language",
	"sepedi-home-language",
	"sesotho-home-language",
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
