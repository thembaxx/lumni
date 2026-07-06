import subjectsData from "@/data/subjects.json";

const SUBJECT_ABBREVIATIONS: Record<string, string> = {
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
  "life-orientation": "LO",
  "agricultural-sciences": "AgriSci",
  "agricultural-management-practices": "AMP",
  "agricultural-technology": "AgriTech",
  "civil-technology": "CivilTech",
  "consumer-studies": "ConStud",
  "dance-studies": "Dance",
  design: "Design",
  "dramatic-arts": "Drama",
  "electrical-technology": "ElecTech",
  "engineering-graphics-and-design": "EGD",
  "hospitality-studies": "Hosp",
  "mechanical-technology": "MechTech",
  music: "Music",
  "religion-studies": "RelStud",
  "technical-mathematics": "TechMath",
  "technical-sciences": "TechSci",
  tourism: "Tour",
  "visual-arts": "VisArts",
  "isi-ndebele-home-language": "IsiNde",
  "isi-xhosa-first-additional-language": "XhoFAL",
  "isi-xhosa-home-language": "XhoHL",
  "isi-zulu-first-additional-language": "ZulFAL",
  "isi-zulu-home-language": "ZulHL",
  "sepedi-first-additional-language": "SepFAL",
  "sepedi-home-language": "SepHL",
  "sesotho-first-additional-language": "SesFAL",
  "sesotho-home-language": "SesHL",
  "setswana-first-additional-language": "TswFAL",
  "setswana-home-language": "TswHL",
  "si-swati-home-language": "SiSwa",
  "tshivenda-home-language": "Tshi",
  "xitsonga-home-language": "Xits",
};

const TAILWIND_COLORS: Record<string, string> = {
  mathematics: "bg-(--system-accent)",
  "physical-sciences": "bg-success",
  "life-sciences": "bg-accent",
  "english-home-language": "bg-warning",
  "afrikaans-home-language": "bg-destructive",
  geography: "bg-info",
  history: "bg-warning",
  accounting: "bg-warning-foreground",
  "business-studies": "bg-accent",
  economics: "bg-info",
  "mathematical-literacy": "bg-(--chart-3)",
  "computer-applications-technology": "bg-(--chart-4)",
  "information-technology": "bg-(--chart-5)",
};

const OKLCH_COLORS: Record<string, string> = {
  mathematics: "oklch(70.6% 0.132 264°)",
  "technical-mathematics": "oklch(71.8% 0.143 286°)",
  "physical-sciences": "oklch(73.6% 0.145 155°)",
  "mathematical-literacy": "oklch(76.2% 0.155 49°)",
};

const subjectMap = new Map<string, (typeof subjectsData)[number]>();
for (const s of subjectsData) {
  subjectMap.set(s.id, s);
}

export function getSubjectName(id: string): string {
  return subjectMap.get(id)?.name ?? id;
}

export function getSubjectHexColor(id: string): string {
  return subjectMap.get(id)?.color ?? "oklch(50% 0.02 265)";
}

export function getSubjectTailwindColor(id: string): string {
  return TAILWIND_COLORS[id] || "bg-muted";
}

export function getSubjectOklchColor(id: string): string | undefined {
  return OKLCH_COLORS[id];
}

export function getSubjectAbbr(id: string): string {
  return SUBJECT_ABBREVIATIONS[id] || id.slice(0, 4).toUpperCase();
}

export function formatSubjectLabel(subject: string): string {
  const name = subjectMap.get(subject)?.name;
  if (name) return name;
  return subject
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
