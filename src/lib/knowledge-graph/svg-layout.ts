import type { DiagramColors } from "@/components/quiz/diagrams/diagram-theme";
import { getMasteryColors, getNodeColors } from "./visual-constants";

export const LAYOUT = {
  nodeW: 100,
  nodeH: 32,
  gapX: 20,
  gapY: 60,
  padX: 30,
  padY: 20,
};

export function getSvgDimensions(maxNodes: number) {
  return {
    svgW: maxNodes * (LAYOUT.nodeW + LAYOUT.gapX) + LAYOUT.padX * 2,
    svgH: 3 * (LAYOUT.nodeH + LAYOUT.gapY) + LAYOUT.padY * 2,
  };
}

export function getNodeX(index: number, total: number, svgW: number) {
  const rowWidth = total * (LAYOUT.nodeW + LAYOUT.gapX) - LAYOUT.gapX;
  const startX = (svgW - rowWidth) / 2;
  return startX + index * (LAYOUT.nodeW + LAYOUT.gapX);
}

export function getNodeY(rowIndex: number) {
  return LAYOUT.padY + rowIndex * (LAYOUT.nodeH + LAYOUT.gapY);
}

export function getNodeCenter(rowIndex: number, index: number, total: number, svgW: number) {
  return {
    x: getNodeX(index, total, svgW) + LAYOUT.nodeW / 2,
    y: getNodeY(rowIndex) + LAYOUT.nodeH / 2,
  };
}

function getNodeMastery(nodeId: string, masteryMap: Map<string, string>): string {
  return masteryMap.get(nodeId) ?? "untested";
}

export function getNodeStyle(
  nodeId: string,
  nodeType: string,
  masteryMap: Map<string, string>,
  palette: DiagramColors,
) {
  const mastery = getNodeMastery(nodeId, masteryMap);
  const masteryStyle = getMasteryColors(palette)[mastery];
  if (mastery !== "untested") {
    return {
      fill: masteryStyle.fill,
      stroke: masteryStyle.stroke,
      textColor: masteryStyle.text,
    };
  }
  const nodeStyle = getNodeColors(palette)[nodeType] ?? getNodeColors(palette).core;
  return {
    fill: nodeStyle.fill,
    stroke: nodeStyle.stroke,
    textColor: nodeStyle.text,
  };
}
