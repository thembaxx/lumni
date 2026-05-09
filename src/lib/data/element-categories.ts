export interface ElementCategoryConfig {
	bg: string;
	glow: string;
	label: string;
	rgb: string;
}

export const elementCategoryConfig: Record<string, ElementCategoryConfig> = {
	"alkali-metal": {
		bg: "bg-red-500/90",
		glow: "shadow-[0_0_20px_rgba(239,68,68,0.6)]",
		label: "Alkali",
		rgb: "239, 68, 68",
	},
	"alkaline-earth": {
		bg: "bg-orange-500/90",
		glow: "shadow-[0_0_20px_rgba(249,115,22,0.6)]",
		label: "Alkaline",
		rgb: "249, 115, 22",
	},
	"transition-metal": {
		bg: "bg-yellow-500/90",
		glow: "shadow-[0_0_20px_rgba(234,179,8,0.6)]",
		label: "Transition",
		rgb: "234, 179, 8",
	},
	"post-transition": {
		bg: "bg-green-500/90",
		glow: "shadow-[0_0_20px_rgba(34,197,94,0.6)]",
		label: "Post-Trans",
		rgb: "34, 197, 94",
	},
	metalloid: {
		bg: "bg-teal-500/90",
		glow: "shadow-[0_0_20px_rgba(20,184,166,0.6)]",
		label: "Metalloid",
		rgb: "20, 184, 166",
	},
	nonmetal: {
		bg: "bg-cyan-500/90",
		glow: "shadow-[0_0_20px_rgba(6,182,212,0.6)]",
		label: "Nonmetal",
		rgb: "6, 182, 212",
	},
	halogen: {
		bg: "bg-blue-500/90",
		glow: "shadow-[0_0_20px_rgba(59,130,246,0.6)]",
		label: "Halogen",
		rgb: "59, 130, 246",
	},
	"noble-gas": {
		bg: "bg-indigo-500/90",
		glow: "shadow-[0_0_20px_rgba(99,102,241,0.6)]",
		label: "Noble Gas",
		rgb: "99, 102, 241",
	},
	lanthanide: {
		bg: "bg-purple-500/90",
		glow: "shadow-[0_0_20px_rgba(168,85,247,0.6)]",
		label: "Lanthanide",
		rgb: "168, 85, 247",
	},
	actinide: {
		bg: "bg-pink-500/90",
		glow: "shadow-[0_0_20px_rgba(236,72,153,0.6)]",
		label: "Actinide",
		rgb: "236, 72, 153",
	},
	unknown: {
		bg: "bg-gray-500/90",
		glow: "shadow-[0_0_20px_rgba(156,163,175,0.6)]",
		label: "Unknown",
		rgb: "156, 163, 175",
	},
};

export const elementEaseOutQuart = [0.25, 1, 0.5, 1] as const;
export const elementEaseOutQuint = [0.22, 1, 0.36, 1] as const;
export const elementEaseOutExpo = [0.16, 1, 0.3, 1] as const;
export const elementEaseOutBack = [0.34, 1.56, 0.64, 1] as const;
