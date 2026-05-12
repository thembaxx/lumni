export interface ElementCategoryConfig {
	bg: string;
	glow: string;
	label: string;
	rgb: string;
}

export const elementCategoryConfig: Record<string, ElementCategoryConfig> = {
	"alkali-metal": {
		bg: "bg-red-500/90",
		glow: "shadow-[0_0_20px_oklch(59.3%_0.194_28°_/_0.6)]",
		label: "Alkali",
		rgb: "59.3% 0.194 28°",
	},
	"alkaline-earth": {
		bg: "bg-orange-500/90",
		glow: "shadow-[0_0_20px_oklch(69.6%_0.196_49°_/_0.6)]",
		label: "Alkaline",
		rgb: "69.6% 0.196 49°",
	},
	"transition-metal": {
		bg: "bg-yellow-500/90",
		glow: "shadow-[0_0_20px_oklch(78.6%_0.156_80°_/_0.6)]",
		label: "Transition",
		rgb: "78.6% 0.156 80°",
	},
	"post-transition": {
		bg: "bg-green-500/90",
		glow: "shadow-[0_0_20px_oklch(64.8%_0.173_142°_/_0.6)]",
		label: "Post-Trans",
		rgb: "64.8% 0.173 142°",
	},
	metalloid: {
		bg: "bg-teal-500/90",
		glow: "shadow-[0_0_20px_oklch(66.4%_0.125_186°_/_0.6)]",
		label: "Metalloid",
		rgb: "66.4% 0.125 186°",
	},
	nonmetal: {
		bg: "bg-cyan-500/90",
		glow: "shadow-[0_0_20px_oklch(66.1%_0.142_210°_/_0.6)]",
		label: "Nonmetal",
		rgb: "66.1% 0.142 210°",
	},
	halogen: {
		bg: "bg-[--system-accent]/90",
		glow: "shadow-[0_0_20px_oklch(57.7%_0.184_264°_/_0.6)]",
		label: "Halogen",
		rgb: "57.7% 0.184 264°",
	},
	"noble-gas": {
		bg: "bg-indigo-500/90",
		glow: "shadow-[0_0_20px_oklch(52.5%_0.142_274°_/_0.6)]",
		label: "Noble Gas",
		rgb: "52.5% 0.142 274°",
	},
	lanthanide: {
		bg: "bg-purple-500/90",
		glow: "shadow-[0_0_20px_oklch(60.2%_0.156_305°_/_0.6)]",
		label: "Lanthanide",
		rgb: "60.2% 0.156 305°",
	},
	actinide: {
		bg: "bg-pink-500/90",
		glow: "shadow-[0_0_20px_oklch(62.2%_0.195_348°_/_0.6)]",
		label: "Actinide",
		rgb: "62.2% 0.195 348°",
	},
	unknown: {
		bg: "bg-gray-500/90",
		glow: "shadow-[0_0_20px_oklch(70.3%_0.012_264°_/_0.6)]",
		label: "Unknown",
		rgb: "70.3% 0.012 264°",
	},
};

export const elementEaseOutQuart = [0.25, 1, 0.5, 1] as const;
export const elementEaseOutQuint = [0.22, 1, 0.36, 1] as const;
export const elementEaseOutExpo = [0.16, 1, 0.3, 1] as const;
export const elementEaseOutBack = [0.34, 1.56, 0.64, 1] as const;
