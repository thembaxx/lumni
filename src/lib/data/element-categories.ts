export interface ElementCategoryConfig {
	bg: string;
	glow: string;
	label: string;
	rgb: string;
}

// Deliberate design choice: glow effects for element category visualization
export const elementCategoryConfig: Record<string, ElementCategoryConfig> = {
	"alkali-metal": {
		bg: "bg-destructive/90",
		glow: "shadow-[0_0_20px_oklch(59.3%_0.194_28°_/_0.6)]",
		label: "Alkali",
		rgb: "59.3% 0.194 28°",
	},
	"alkaline-earth": {
		bg: "bg-warning/90",
		glow: "shadow-[0_0_20px_oklch(69.6%_0.196_49°_/_0.6)]",
		label: "Alkaline",
		rgb: "69.6% 0.196 49°",
	},
	"transition-metal": {
		bg: "bg-warning/90",
		glow: "shadow-[0_0_20px_oklch(78.6%_0.156_80°_/_0.6)]",
		label: "Transition",
		rgb: "78.6% 0.156 80°",
	},
	"post-transition": {
		bg: "bg-success/90",
		glow: "shadow-[0_0_20px_oklch(64.8%_0.173_142°_/_0.6)]",
		label: "Post-Trans",
		rgb: "64.8% 0.173 142°",
	},
	metalloid: {
		bg: "bg-info/90",
		glow: "shadow-[0_0_20px_oklch(66.4%_0.125_186°_/_0.6)]",
		label: "Metalloid",
		rgb: "66.4% 0.125 186°",
	},
	nonmetal: {
		bg: "bg-info/90",
		glow: "shadow-[0_0_20px_oklch(66.1%_0.142_210°_/_0.6)]",
		label: "Nonmetal",
		rgb: "66.1% 0.142 210°",
	},
	halogen: {
		bg: "bg-accent/90",
		glow: "shadow-[0_0_20px_oklch(52%_0.18_146°_/_0.6)]",
		label: "Halogen",
		rgb: "52% 0.18 146°",
	},
	"noble-gas": {
		bg: "bg-accent/90",
		glow: "shadow-[0_0_20px_oklch(88%_0.06_146°_/_0.6)]",
		label: "Noble Gas",
		rgb: "88% 0.06 146°",
	},
	lanthanide: {
		bg: "bg-accent/90",
		glow: "shadow-[0_0_20px_oklch(72%_0.08_146°_/_0.6)]",
		label: "Lanthanide",
		rgb: "72% 0.08 146°",
	},
	actinide: {
		bg: "bg-[--system-accent]/90",
		glow: "shadow-[0_0_20px_oklch(52%_0.18_146°_/_0.6)]",
		label: "Actinide",
		rgb: "52% 0.18 146°",
	},
	unknown: {
		bg: "bg-muted/90",
		glow: "shadow-[0_0_20px_oklch(70.3%_0.012_146°_/_0.6)]",
		label: "Unknown",
		rgb: "70.3% 0.012 146°",
	},
};

export const elementEaseOutQuart = [0.25, 1, 0.5, 1] as const;
export const elementEaseOutQuint = [0.22, 1, 0.36, 1] as const;
export const elementEaseOutExpo = [0.16, 1, 0.3, 1] as const;
export const elementEaseOutBack = [0.34, 1.56, 0.64, 1] as const;
