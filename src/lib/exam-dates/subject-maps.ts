import {
	getSubjectHexColor,
	getSubjectName,
	getSubjectOklchColor,
	getSubjectTailwindColor,
	getSubjectAbbr as getUnifiedAbbr,
} from "@/lib/subjects";

export {
	getSubjectHexColor,
	getSubjectName,
	getSubjectOklchColor,
	getSubjectTailwindColor,
};

export const subjectColors: Record<string, string> = {
	mathematics: "bg-[--system-accent]",
	"physical-sciences": "bg-success",
	"life-sciences": "bg-accent",
	"english-home-language": "bg-warning",
	"afrikaans-home-language": "bg-destructive",
	geography: "bg-info",
	history: "bg-warning",
	accounting: "bg-warning-foreground",
	"business-studies": "bg-accent",
	economics: "bg-info",
	"mathematical-literacy": "bg-[--chart-3]",
	"computer-applications-technology": "bg-[--chart-4]",
	"information-technology": "bg-[--chart-5]",
};

export const subjectAbbrs: Record<string, string> = {
	mathematics: "Math",
	"physical-sciences": "PhySci",
	"life-sciences": "LifeSci",
	"english-home-language": "EngHL",
	"english-first-additional-language": "EngFAL",
	"afrikaans-home-language": "AfrHL",
	"afrikaans-first-additional-language": "AfrFAL",
	geography: "Geo",
	history: "Hist",
	accounting: "Acc",
	"business-studies": "Bus",
	economics: "Econ",
	"mathematical-literacy": "MathLit",
	"computer-applications-technology": "CAT",
	"information-technology": "IT",
};

export function getSubjectColor(subjectId: string): string {
	return subjectColors[subjectId] || "bg-muted";
}

export function getSubjectAbbr(subjectId: string): string {
	return getUnifiedAbbr(subjectId);
}
