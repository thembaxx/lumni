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
		name: "Mathematical Literacy",
		code: "mathematical-literacy",
		category: "mathematics",
		color: "oklch(64.7% 0.146 240°)",
		icon: "calculator",
	},
	{
		name: "Technical Mathematics",
		code: "technical-mathematics",
		category: "mathematics",
		color: "oklch(60.7% 0.162 252°)",
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
		name: "Technical Sciences",
		code: "technical-sciences",
		category: "sciences",
		color: "oklch(60.3% 0.182 32°)",
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
		name: "Agricultural Sciences",
		code: "agricultural-sciences",
		category: "sciences",
		color: "oklch(66.0% 0.165 130°)",
		icon: "leaf",
	},
	{
		name: "Agricultural Management Practices",
		code: "agricultural-management-practices",
		category: "sciences",
		color: "oklch(62.0% 0.155 135°)",
		icon: "leaf",
	},
	{
		name: "Agricultural Technology",
		code: "agricultural-technology",
		category: "sciences",
		color: "oklch(63.0% 0.160 140°)",
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
	{
		name: "English Home Language",
		code: "english-home-language",
		category: "languages",
		color: "oklch(65.0% 0.120 280°)",
		icon: "book",
	},
	{
		name: "English First Additional Language",
		code: "english-first-additional-language",
		category: "languages",
		color: "oklch(63.0% 0.110 275°)",
		icon: "book",
	},
	{
		name: "Afrikaans Home Language",
		code: "afrikaans-home-language",
		category: "languages",
		color: "oklch(64.0% 0.125 290°)",
		icon: "book",
	},
	{
		name: "Afrikaans First Additional Language",
		code: "afrikaans-first-additional-language",
		category: "languages",
		color: "oklch(62.0% 0.115 285°)",
		icon: "book",
	},
	{
		name: "isiZulu Home Language",
		code: "isi-zulu-home-language",
		category: "languages",
		color: "oklch(63.5% 0.130 270°)",
		icon: "book",
	},
	{
		name: "isiZulu First Additional Language",
		code: "isi-zulu-first-additional-language",
		category: "languages",
		color: "oklch(61.5% 0.120 265°)",
		icon: "book",
	},
	{
		name: "isiXhosa Home Language",
		code: "isi-xhosa-home-language",
		category: "languages",
		color: "oklch(64.5% 0.135 260°)",
		icon: "book",
	},
	{
		name: "isiXhosa First Additional Language",
		code: "isi-xhosa-first-additional-language",
		category: "languages",
		color: "oklch(62.5% 0.125 255°)",
		icon: "book",
	},
	{
		name: "Sepedi Home Language",
		code: "sepedi-home-language",
		category: "languages",
		color: "oklch(63.8% 0.122 268°)",
		icon: "book",
	},
	{
		name: "Sesotho Home Language",
		code: "sesotho-home-language",
		category: "languages",
		color: "oklch(62.8% 0.118 262°)",
		icon: "book",
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
		name: "Functions and Graphs",
		subjectCode: "mathematics",
		description: "Functions, inverses, exponential and logarithmic functions",
	},
	{
		name: "Finance and Growth",
		subjectCode: "mathematical-literacy",
		description: "Simple and compound interest, loans, investments, inflation",
	},
	{
		name: "Data Handling",
		subjectCode: "mathematical-literacy",
		description: "Representing data, measures of central tendency and spread",
	},
	{
		name: "Probability",
		subjectCode: "mathematical-literacy",
		description: "Probability calculations, tree diagrams, contingency tables",
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
	{
		name: "Human Reproduction",
		subjectCode: "life-sciences",
		description:
			"Reproductive systems, gametogenesis, fertilisation, gestation",
	},
	{
		name: "Environmental Studies",
		subjectCode: "geography",
		description: "Climate, weather, geomorphology, settlement geography",
	},
	{
		name: "Mapwork and GIS",
		subjectCode: "geography",
		description: "Topographic maps, orthophotos, GIS, map calculations",
	},
	{
		name: "Source-based History",
		subjectCode: "history",
		description: "Source analysis, essay writing, historiography",
	},
	{
		name: "Accounting Concepts",
		subjectCode: "accounting",
		description: "GAAP, IFRS, accounting equation, journals, ledgers",
	},
	{
		name: "Financial Statements",
		subjectCode: "accounting",
		description: "Income statement, balance sheet, cash flow, analysis",
	},
	{
		name: "Managerial Accounting",
		subjectCode: "accounting",
		description: "Budgeting, cost accounting, break-even analysis",
	},
	{
		name: "Business Environments",
		subjectCode: "business-studies",
		description: "Micro, market, macro environments, business sectors",
	},
	{
		name: "Business Operations",
		subjectCode: "business-studies",
		description: "Management, leadership, quality, investment, insurance",
	},
	{
		name: "Microeconomics",
		subjectCode: "economics",
		description: "Demand and supply, market structures, price elasticity",
	},
	{
		name: "Macroeconomics",
		subjectCode: "economics",
		description: "Circular flow, aggregates, multipliers, economic indicators",
	},
	{
		name: "Comprehension and Language",
		subjectCode: "english-home-language",
		description: "Reading comprehension, grammar, vocabulary, summary writing",
	},
	{
		name: "Literature",
		subjectCode: "english-home-language",
		description: "Poetry, novels, drama, literary analysis, essay writing",
	},
	{
		name: "Begrip en Taal",
		subjectCode: "afrikaans-home-language",
		description: "Leesbegrip, grammatika, woordeskat, opsomming",
	},
	{
		name: "Letterkunde",
		subjectCode: "afrikaans-home-language",
		description: "Gedig, roman, drama, letterkundige ontleding",
	},
	{
		name: "Ukuqonda Nokufunda",
		subjectCode: "isi-zulu-home-language",
		description: "Ukufunda ukuqonda, uhlelo lolimi, isilulumagama",
	},
	{
		name: "Imibhalo",
		subjectCode: "isi-zulu-home-language",
		description: "Izinkondlo, amanoveli, umdlalo, ukuhlaziywa kwemibhalo",
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
