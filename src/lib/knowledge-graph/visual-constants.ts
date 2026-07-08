import type { DiagramColors } from "@/components/quiz/diagrams/diagram-theme";

export interface NodeColorSet {
  fill: string;
  stroke: string;
  text: string;
}

export const LAYER_KEYS = ["prerequisite", "core", "advanced"] as const;

/**
 * Layer (topic-type) colors, derived from the shared diagram palette so the
 * knowledge graph is light/dark aware instead of hardcoded Tailwind classes.
 */
export function getNodeColors(palette: DiagramColors): Record<string, NodeColorSet> {
  return {
    prerequisite: { fill: palette.chart5, stroke: palette.chart5, text: palette.chart5 },
    core: { fill: palette.chart1, stroke: palette.chart1, text: palette.chart1 },
    advanced: { fill: palette.chart3, stroke: palette.chart3, text: palette.chart3 },
  };
}

/**
 * Mastery-tier colors, derived from the shared diagram palette.
 */
export function getMasteryColors(palette: DiagramColors): Record<string, NodeColorSet> {
  return {
    novice: { fill: palette.chart2, stroke: palette.chart2, text: palette.chart2 },
    developing: { fill: palette.chart5, stroke: palette.chart5, text: palette.chart5 },
    proficient: { fill: palette.chart1, stroke: palette.chart1, text: palette.chart1 },
    mastered: { fill: palette.chart3, stroke: palette.chart3, text: palette.chart3 },
    untested: { fill: palette.line, stroke: palette.line, text: palette.textSecondary },
  };
}
