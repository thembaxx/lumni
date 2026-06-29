"use client";

import type React from "react";
import { useMemo } from "react";
import { Arrow, Circle, Group, Layer, Line, Stage, Text } from "react-konva";
import {
  useDiagramTheme,
  getAtomColor,
  getAtomTextColor,
  type DiagramColors,
} from "./diagram-theme";

interface Atom {
  element: string;
  x: number;
  y: number;
  label?: string;
}

interface Bond {
  fromIndex: number;
  toIndex: number;
  type?: "single" | "double" | "triple" | "dashed";
}

interface Molecule {
  atoms: Atom[];
  bonds: Bond[];
}

interface ReactionArrow {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  label?: string;
}

interface ChemistryData {
  molecules: Molecule[];
  reactions?: ReactionArrow[];
}

function renderMolecule(mol: Molecule, molIndex: number, offsetX: number, palette: DiagramColors) {
  const elements: React.ReactNode[] = [];
  const bondOffsets = [
    { dx1: 0, dy1: -3, dx2: 0, dy2: -3 },
    { dx1: 0, dy1: 3, dx2: 0, dy2: 3 },
    { dx1: 0, dy1: -3, dx2: 0, dy2: 3 },
  ];

  const ATOM_RADII: Record<string, number> = {
    C: 12,
    H: 8,
    O: 11,
    N: 11,
    S: 14,
    P: 14,
    F: 11,
    Cl: 14,
    Br: 15,
    I: 16,
  };

  mol.bonds.forEach((bond, _bIdx) => {
    const from = mol.atoms[bond.fromIndex];
    const to = mol.atoms[bond.toIndex];
    if (!from || !to) return;

    const type = bond.type || "single";
    const count = type === "single" ? 1 : type === "double" ? 2 : type === "triple" ? 3 : 1;
    const isDashed = type === "dashed";

    for (let i = 0; i < count; i++) {
      const offset = bondOffsets[i] || { dx1: 0, dy1: 0, dx2: 0, dy2: 0 };
      elements.push(
        <Line
          key={`mol-${molIndex}-bond-${bond.fromIndex}-${bond.toIndex}-${offset.dx1}-${offset.dy1}-${offset.dx2}-${offset.dy2}`}
          points={[
            offsetX + from.x + offset.dx1,
            from.y + offset.dy1,
            offsetX + to.x + offset.dx2,
            to.y + offset.dy2,
          ]}
          stroke={palette.lineSubtle}
          strokeWidth={2}
          dash={isDashed ? [4, 3] : undefined}
        />,
      );
    }
  });

  mol.atoms.forEach((atom, _aIdx) => {
    const r = ATOM_RADII[atom.element] || 10;
    elements.push(
      <Group key={`mol-${molIndex}-atom-${atom.element}-${atom.x}-${atom.y}`}>
        <Circle
          x={offsetX + atom.x}
          y={atom.y}
          radius={r}
          fill={getAtomColor(palette, atom.element)}
          stroke={palette.lineSubtle}
          strokeWidth={1}
        />
        <Text
          x={offsetX + atom.x - r * 0.6}
          y={atom.y - 5}
          text={atom.element}
          fontSize={r > 10 ? 10 : 8}
          fill={getAtomTextColor(palette, atom.element)}
          fontStyle="bold"
        />
        {atom.label && (
          <Text
            x={offsetX + atom.x + r + 3}
            y={atom.y - 5}
            text={atom.label}
            fontSize={9}
            fill={palette.textSecondary}
          />
        )}
      </Group>,
    );
  });

  return elements;
}

export function ChemistryDiagram({ data }: { data: ChemistryData }) {
  const palette = useDiagramTheme();
  const molecules = useMemo(() => data.molecules || [], [data.molecules]);
  const reactions = useMemo(() => data.reactions || [], [data.reactions]);

  const molWidth = 100;
  const totalWidth = Math.max(300, molecules.length * molWidth + 80);

  const elements = useMemo(() => {
    const result: React.ReactNode[] = [];

    molecules.forEach((mol, i) => {
      const offsetX = i * molWidth + 40;
      result.push(...renderMolecule(mol, i, offsetX, palette));
    });

    reactions.forEach((r, _i) => {
      const midY = (r.fromY + r.toY) / 2;
      result.push(
        <Arrow
          key={`rxn-${r.fromX}-${r.fromY}-${r.toX}-${r.toY}`}
          points={[r.fromX, r.fromY, r.toX, r.toY]}
          stroke={palette.accent}
          fill={palette.accent}
          strokeWidth={2}
          pointerLength={8}
          pointerWidth={8}
        />,
      );
      if (r.label) {
        result.push(
          <Text
            key={`rxn-label-${r.fromX}-${r.fromY}-${r.toX}-${r.toY}`}
            x={(r.fromX + r.toX) / 2 - 20}
            y={midY - 18}
            text={r.label}
            fontSize={10}
            fill={palette.textSecondary}
            fontStyle="italic"
          />,
        );
      }
    });

    return result;
  }, [molecules, reactions, palette]);

  return (
    <Stage
      width={totalWidth}
      height={200}
      className="w-full rounded-2xl border bg-background/40"
      ariaLabel="Chemistry molecular structure diagram"
    >
      <Layer>{elements}</Layer>
    </Stage>
  );
}
