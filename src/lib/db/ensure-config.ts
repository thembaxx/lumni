import type { SeedConfig, SeededDoc } from "./ensure";

const subjectDefs = [
	{
		name: "Mathematics",
		code: "mathematics",
		category: "mathematics",
		color: "oklch(57.7% 0.184 264°)",
		icon: "calculator",
	},
	{
		name: "Physical Sciences",
		code: "physical-sciences",
		category: "sciences",
		color: "oklch(59.3% 0.194 28°)",
		icon: "flask",
	},
	{
		name: "Life Sciences",
		code: "life-sciences",
		category: "sciences",
		color: "oklch(64.8% 0.173 142°)",
		icon: "leaf",
	},
	{
		name: "Accounting",
		code: "accounting",
		category: "commerce",
		color: "oklch(75.4% 0.154 70°)",
		icon: "book",
	},
	{
		name: "Business Studies",
		code: "business-studies",
		category: "commerce",
		color: "oklch(53.5% 0.182 286°)",
		icon: "briefcase",
	},
	{
		name: "Economics",
		code: "economics",
		category: "commerce",
		color: "oklch(66.1% 0.142 210°)",
		icon: "trending-up",
	},
	{
		name: "Geography",
		code: "geography",
		category: "social",
		color: "oklch(62.1% 0.186 155°)",
		icon: "globe",
	},
	{
		name: "History",
		code: "history",
		category: "social",
		color: "oklch(69.6% 0.196 49°)",
		icon: "clock",
	},
];

const topicDefs = [
	{
		name: "Calculus",
		subjectCode: "mathematics",
		description: "Differential calculus, Integration, Applications",
	},
	{
		name: "Algebra",
		subjectCode: "mathematics",
		description: "Number patterns, Sequences and series, Finance",
	},
	{
		name: "Trigonometry",
		subjectCode: "mathematics",
		description: "Trigonometric identities, Equations, Graphs",
	},
	{
		name: "Mechanics",
		subjectCode: "physical-sciences",
		description: "Momentum, Newton's Laws, Work, Energy and Power",
	},
	{
		name: "Waves and Sound",
		subjectCode: "physical-sciences",
		description: "Wave properties, Doppler effect, Sound waves",
	},
	{
		name: "Electricity and Magnetism",
		subjectCode: "physical-sciences",
		description: "Electric circuits, Electrostatics, Electrodynamics",
	},
	{
		name: "Matter and Materials",
		subjectCode: "physical-sciences",
		description: "Organic chemistry, Rates of reaction, Chemical equilibrium",
	},
	{
		name: "Genetics",
		subjectCode: "life-sciences",
		description: "DNA, inheritance, genetic engineering",
	},
	{
		name: "Evolution",
		subjectCode: "life-sciences",
		description: "Natural selection, speciation, human evolution",
	},
];

export const seedConfig: SeedConfig = {
	subjects: {
		matchField: "code",
		documents: subjectDefs,
	},
	topics: {
		matchField: "name",
		documents: async (seeded: Record<string, SeededDoc[]>) => {
			const subjectMap = new Map<string, string>();
			for (const s of seeded.subjects ?? []) {
				subjectMap.set(s.code as string, s.$id);
			}
			return topicDefs.map((t) => ({
				name: t.name,
				subjectId: subjectMap.get(t.subjectCode) ?? "",
				description: t.description,
				orderIndex: 0,
			}));
		},
	},
};
