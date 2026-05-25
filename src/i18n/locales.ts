export const locales = [
	"en",
	"af",
	"zu",
	"xh",
	"st",
	"tn",
	"nso",
	"ts",
	"ss",
	"ve",
	"nd",
] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeLabels: Record<Locale, string> = {
	en: "English",
	af: "Afrikaans",
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

export function isValidLocale(value: string): value is Locale {
	return (locales as readonly string[]).includes(value);
}
