export const nscSubjects = [
	{
		id: "mathematics",
		name: "Mathematics",
		icon: "calculator",
		color: "oklch(57.7% 0.184 264°)",
	},
	{
		id: "mathematical-literacy",
		name: "Mathematical Literacy",
		icon: "calculator",
		color: "oklch(69.6% 0.196 49°)",
	},
	{
		id: "physical-sciences",
		name: "Physical Sciences",
		icon: "atom",
		color: "oklch(62.1% 0.186 155°)",
	},
	{
		id: "life-sciences",
		name: "Life Sciences",
		icon: "dna",
		color: "oklch(53.5% 0.182 286°)",
	},
	{
		id: "accounting",
		name: "Accounting",
		icon: "receipt",
		color: "oklch(75.4% 0.154 70°)",
	},
	{
		id: "business-studies",
		name: "Business Studies",
		icon: "briefcase",
		color: "oklch(62.2% 0.195 348°)",
	},
	{
		id: "economics",
		name: "Economics",
		icon: "trending-up",
		color: "oklch(66.1% 0.142 210°)",
	},
	{
		id: "geography",
		name: "Geography",
		icon: "globe",
		color: "oklch(66.4% 0.125 186°)",
	},
	{
		id: "history",
		name: "History",
		icon: "book-open",
		color: "oklch(51.7% 0.196 29°)",
	},
	{
		id: "english-home-language",
		name: "English",
		icon: "languages",
		color: "oklch(57.7% 0.184 264°)",
	},
	{
		id: "afrikaans-home-language",
		name: "Afrikaans",
		icon: "languages",
		color: "oklch(69.6% 0.196 49°)",
	},
	{
		id: "information-technology",
		name: "Information Technology",
		icon: "laptop",
		color: "oklch(52.5% 0.142 274°)",
	},
] as const;

export type NSCSubject = (typeof nscSubjects)[number];
