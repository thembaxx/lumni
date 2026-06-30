export const NODE_COLORS: Record<string, string> = {
  prerequisite: "fill-amber-500 stroke-amber-600",
  core: "fill-blue-500 stroke-blue-600",
  advanced: "fill-emerald-500 stroke-emerald-600",
};

export const MASTERY_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  novice: {
    fill: "fill-red-400 stroke-red-500",
    stroke: "stroke-red-500",
    text: "oklch(55% 0.18 25)",
  },
  developing: {
    fill: "fill-amber-400 stroke-amber-500",
    stroke: "stroke-amber-500",
    text: "oklch(75% 0.15 70)",
  },
  proficient: {
    fill: "fill-blue-400 stroke-blue-500",
    stroke: "stroke-blue-500",
    text: "oklch(60% 0.15 240)",
  },
  mastered: {
    fill: "fill-emerald-400 stroke-emerald-500",
    stroke: "stroke-emerald-500",
    text: "oklch(65% 0.2 145)",
  },
  untested: {
    fill: "fill-slate-300 stroke-slate-400",
    stroke: "stroke-slate-400",
    text: "oklch(70% 0 0)",
  },
};

export const LAYER_KEYS = ["prerequisite", "core", "advanced"] as const;

export const NODE_TEXT_COLORS: Record<string, string> = {
  prerequisite: "oklch(70% 0.15 70)",
  core: "oklch(55% 0.15 240)",
  advanced: "oklch(60% 0.15 145)",
};
