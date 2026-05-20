"use client";

import type React from "react";
import { useMemo } from "react";
import { Arrow, Circle, Group, Layer, Line, Stage, Text } from "react-konva";

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

function getAtomColor(element: string): string {
	const colors: Record<string, string> = {
		C: "oklch(55% 0 0)",
		H: "oklch(100% 0 0)",
		O: "oklch(65% 0.2 30)",
		N: "oklch(55% 0.2 240)",
		S: "oklch(60% 0.2 100)",
		P: "oklch(60% 0.2 280)",
		F: "oklch(50% 0.15 140)",
		Cl: "oklch(50% 0.15 140)",
		Br: "oklch(45% 0.15 30)",
		I: "oklch(40% 0.15 280)",
		Na: "oklch(60% 0.15 50)",
		Fe: "oklch(50% 0.15 30)",
		Cu: "oklch(55% 0.15 40)",
		Zn: "oklch(55% 0.1 200)",
		Mg: "oklch(55% 0.1 140)",
		Ca: "oklch(60% 0.1 80)",
		He: "oklch(60% 0.1 240)",
		Ne: "oklch(60% 0.1 240)",
		Ar: "oklch(60% 0.1 240)",
	};
	return colors[element] || "oklch(55% 0.1 0)";
}

function getAtomRadius(element: string): number {
	const radii: Record<string, number> = {
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
	return radii[element] || 10;
}

function renderMolecule(mol: Molecule, molIndex: number, offsetX: number) {
	const elements: React.ReactNode[] = [];
	const bondOffsets = [
		{ dx1: 0, dy1: -3, dx2: 0, dy2: -3 },
		{ dx1: 0, dy1: 3, dx2: 0, dy2: 3 },
		{ dx1: 0, dy1: -3, dx2: 0, dy2: 3 },
	];

	mol.bonds.forEach((bond, _bIdx) => {
		const from = mol.atoms[bond.fromIndex];
		const to = mol.atoms[bond.toIndex];
		if (!from || !to) return;

		const type = bond.type || "single";
		const count =
			type === "single" ? 1 : type === "double" ? 2 : type === "triple" ? 3 : 1;
		const isDashed = type === "dashed";

		for (let i = 0; i < count; i++) {
			const offset = bondOffsets[i] || { dx1: 0, dy1: 0, dx2: 0, dy2: 0 };
			elements.push(
				<Line
					key={`mol-${molIndex}-bond-${bond.fromIndex}-${bond.toIndex}-${i}`}
					points={[
						offsetX + from.x + offset.dx1,
						from.y + offset.dy1,
						offsetX + to.x + offset.dx2,
						to.y + offset.dy2,
					]}
					stroke="oklch(32.5% 0.012 264°)"
					strokeWidth={2}
					dash={isDashed ? [4, 3] : undefined}
				/>,
			);
		}
	});

	mol.atoms.forEach((atom, _aIdx) => {
		const r = getAtomRadius(atom.element);
		elements.push(
			<Group key={`mol-${molIndex}-atom-${atom.element}-${atom.x}-${atom.y}`}>
				<Circle
					x={offsetX + atom.x}
					y={atom.y}
					radius={r}
					fill={getAtomColor(atom.element)}
					stroke="oklch(32.5% 0.012 264° / 0.3)"
					strokeWidth={1}
				/>
				<Text
					x={offsetX + atom.x - r * 0.6}
					y={atom.y - 5}
					text={atom.element}
					fontSize={r > 10 ? 10 : 8}
					fill="oklch(100% 0 0)"
					fontStyle="bold"
				/>
				{atom.label && (
					<Text
						x={offsetX + atom.x + r + 3}
						y={atom.y - 5}
						text={atom.label}
						fontSize={9}
						fill="oklch(52.9% 0.012 264°)"
					/>
				)}
			</Group>,
		);
	});

	return elements;
}

export function ChemistryDiagram({ data }: { data: ChemistryData }) {
	const molecules = useMemo(() => data.molecules || [], [data.molecules]);
	const reactions = useMemo(() => data.reactions || [], [data.reactions]);

	const molWidth = 100;
	const totalWidth = Math.max(300, molecules.length * molWidth + 80);

	const elements = useMemo(() => {
		const result: React.ReactNode[] = [];

		molecules.forEach((mol, i) => {
			const offsetX = i * molWidth + 40;
			result.push(...renderMolecule(mol, i, offsetX));
		});

		reactions.forEach((r, _i) => {
			const midY = (r.fromY + r.toY) / 2;
			result.push(
				<Arrow
					key={`rxn-${r.fromX}-${r.fromY}-${r.toX}-${r.toY}`}
					points={[r.fromX, r.fromY, r.toX, r.toY]}
					stroke="oklch(55.6% 0.219 264)"
					fill="oklch(55.6% 0.219 264)"
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
						fill="oklch(52.9% 0.012 264°)"
						fontStyle="italic"
					/>,
				);
			}
		});

		return result;
	}, [molecules, reactions]);

	return (
		<Stage
			width={totalWidth}
			height={200}
			className="w-full rounded-2xl border bg-background/40"
		>
			<Layer>{elements}</Layer>
		</Stage>
	);
}
