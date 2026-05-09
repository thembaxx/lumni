export const nscSubjects = [
	{
		id: "mathematics",
		name: "Mathematics",
		icon: "calculator",
		color: "#3b82f6",
	},
	{
		id: "mathematical-literacy",
		name: "Mathematical Literacy",
		icon: "calculator",
		color: "#f97316",
	},
	{
		id: "physical-sciences",
		name: "Physical Sciences",
		icon: "atom",
		color: "#10b981",
	},
	{
		id: "life-sciences",
		name: "Life Sciences",
		icon: "dna",
		color: "#8b5cf6",
	},
	{
		id: "accounting",
		name: "Accounting",
		icon: "receipt",
		color: "#f59e0b",
	},
	{
		id: "business-studies",
		name: "Business Studies",
		icon: "briefcase",
		color: "#ec4899",
	},
	{
		id: "economics",
		name: "Economics",
		icon: "trending-up",
		color: "#06b6d4",
	},
	{
		id: "geography",
		name: "Geography",
		icon: "globe",
		color: "#14b8a6",
	},
	{
		id: "history",
		name: "History",
		icon: "book-open",
		color: "#dc2626",
	},
	{
		id: "english-home-language",
		name: "English",
		icon: "languages",
		color: "#3b82f6",
	},
	{
		id: "afrikaans-home-language",
		name: "Afrikaans",
		icon: "languages",
		color: "#f97316",
	},
	{
		id: "information-technology",
		name: "Information Technology",
		icon: "laptop",
		color: "#6366f1",
	},
] as const;

export type NSCSubject = (typeof nscSubjects)[number];