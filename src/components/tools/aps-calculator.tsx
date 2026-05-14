"use client";

import { Calculator, Plus, Trash } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Subject {
	id: string;
	name: string;
	percentage: number;
}

const universityRequirements = [
	{
		university: "University of Cape Town (UCT)",
		minAPS: 33,
		courses: {
			medicine: 40,
			engineering: 36,
			commerce: 33,
			law: 35,
			science: 33,
		},
	},
	{
		university: "University of the Witwatersrand (Wits)",
		minAPS: 34,
		courses: {
			medicine: 38,
			engineering: 33,
			commerce: 32,
			law: 34,
			science: 30,
		},
	},
	{
		university: "University of Pretoria (UP)",
		minAPS: 28,
		courses: {
			medicine: 38,
			engineering: 35,
			commerce: 32,
			law: 32,
			science: 30,
		},
	},
	{
		university: "Stellenbosch University",
		minAPS: 28,
		courses: {
			medicine: 38,
			engineering: 35,
			commerce: 33,
			law: 33,
			science: 30,
		},
	},
	{
		university: "University of Johannesburg (UJ)",
		minAPS: 26,
		courses: {
			medicine: 35,
			engineering: 32,
			commerce: 30,
			law: 30,
			science: 28,
		},
	},
];

export function APSCalculator() {
	const [subjects, setSubjects] = useState<Subject[]>([
		{ id: "1", name: "", percentage: 0 },
	]);
	const [includeLifeOrientation, setIncludeLifeOrientation] = useState(false);
	const [_showResults, _setShowResults] = useState(false);

	const addSubject = () => {
		setSubjects([
			...subjects,
			{ id: Date.now().toString(), name: "", percentage: 0 },
		]);
	};

	const removeSubject = (id: string) => {
		if (subjects.length > 1) {
			setSubjects(subjects.filter((s) => s.id !== id));
		}
	};

	const updateSubject = (
		id: string,
		field: "name" | "percentage",
		value: string | number,
	) => {
		setSubjects(
			subjects.map((s) => (s.id === id ? { ...s, [field]: value } : s)),
		);
	};

	const calculateAPS = (): number => {
		const validSubjects = subjects.filter((s) => s.name && s.percentage > 0);

		const scoredSubjects = validSubjects.map((s) => {
			const pct = s.percentage;
			if (pct >= 80) return 7;
			if (pct >= 70) return 6;
			if (pct >= 60) return 5;
			if (pct >= 50) return 4;
			if (pct >= 40) return 3;
			if (pct >= 30) return 2;
			return 1;
		});

		const filtered = scoredSubjects
			.map((score, idx) => ({
				score,
				isLO: validSubjects[idx].name
					.toLowerCase()
					.includes("life orientation"),
			}))
			.filter((s) => !s.isLO || includeLifeOrientation)
			.sort((a, b) => b.score - a.score)
			.slice(0, 6);

		return filtered.reduce((sum, s) => sum + s.score, 0);
	};

	const getGrade = (percentage: number): string => {
		if (percentage >= 80) return "A - Outstanding";
		if (percentage >= 70) return "B - Meritorious";
		if (percentage >= 60) return "C - Substantial";
		if (percentage >= 50) return "D - Adequate";
		if (percentage >= 40) return "E - Moderate";
		if (percentage >= 30) return "F - Elementary";
		return "G - Not Achieved";
	};

	const getAPSForSubject = (percentage: number): number => {
		if (percentage >= 80) return 7;
		if (percentage >= 70) return 6;
		if (percentage >= 60) return 5;
		if (percentage >= 50) return 4;
		if (percentage >= 40) return 3;
		if (percentage >= 30) return 2;
		return 1;
	};

	const totalAPS = calculateAPS();

	return (
		<div className="p-4 h-full overflow-y-auto">
			<div className="flex flex-col gap-3 mb-6">
				{subjects.map((subject, index) => (
					<motion.div
						key={subject.id}
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ delay: index * 0.05 }}
						className="flex gap-2 items-center"
					>
						<Input
							placeholder="Subject name"
							value={subject.name}
							onChange={(e) =>
								updateSubject(subject.id, "name", e.target.value)
							}
							className="flex-1 rounded-lg"
						/>
						<Input
							type="number"
							placeholder="%"
							min={0}
							max={100}
							value={subject.percentage || ""}
							onChange={(e) =>
								updateSubject(
									subject.id,
									"percentage",
									parseInt(e.target.value) || 0,
								)
							}
							className="w-20 rounded-lg tabular-nums"
						/>
						<Button
							variant="ghost"
							size="icon-sm"
							onClick={() => removeSubject(subject.id)}
							disabled={subjects.length === 1}
							className="active:scale-[0.96] transition-transform duration-150"
						>
							<Trash data-icon />
						</Button>
					</motion.div>
				))}
			</div>

			<div className="flex gap-2 mb-6">
				<Button
					variant="outline"
					onClick={addSubject}
					className="flex-1 rounded-lg active:scale-[0.96] transition-transform duration-150"
				>
					<Plus data-icon className="mr-2" />
					Add Subject
				</Button>
				<Button
					variant={includeLifeOrientation ? "default" : "outline"}
					onClick={() => setIncludeLifeOrientation(!includeLifeOrientation)}
					className="rounded-lg active:scale-[0.96] transition-transform duration-150"
				>
					Include LO
				</Button>
			</div>

			<div className="p-5 rounded-2xl bg-muted shadow-[0_2px_8px_oklch(0%_0_0_/_0.08)] mb-6">
				<div className="flex items-center justify-between mb-2">
					<span className="text-muted-foreground">Your APS Score</span>
					<Calculator className="size-5 text-muted-foreground" />
				</div>
				<div className="text-4xl font-bold text-center tabular-nums">
					{totalAPS}
				</div>
				<p className="text-center text-muted-foreground text-sm mt-2">
					Max possible: 42 points (6 subjects × 7)
				</p>
			</div>

			{subjects.some((s) => s.percentage > 0) && (
				<div className="mb-6">
					<h3 className="font-semibold mb-3 text-wrap balance">
						Subject Breakdown
					</h3>
					<div className="flex flex-col gap-2">
						{subjects
							.filter((s) => s.percentage > 0)
							.sort(
								(a, b) =>
									getAPSForSubject(b.percentage) -
									getAPSForSubject(a.percentage),
							)
							.map((subject, idx) => (
								<div
									key={subject.id}
									className="flex justify-between items-center p-3 rounded-xl bg-card shadow-[0_2px_8px_oklch(0%_0_0_/_0.06)]"
								>
									<div>
										<span className="font-medium">
											{subject.name || `Subject ${idx + 1}`}
										</span>
										<span className="text-muted-foreground text-sm ml-2 tabular-nums">
											({subject.percentage}%)
										</span>
									</div>
									<div className="text-right">
										<span className="font-bold tabular-nums">
											{getAPSForSubject(subject.percentage)} pts
										</span>
										<span className="text-xs text-muted-foreground ml-2 block">
											{getGrade(subject.percentage)}
										</span>
									</div>
								</div>
							))}
					</div>
				</div>
			)}

			<div>
				<h3 className="font-semibold mb-3 text-wrap balance">
					University Requirements
				</h3>
				<div className="flex flex-col gap-3">
					{universityRequirements.map((uni, idx) => (
						<motion.div
							key={uni.university}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.05 }}
						>
							<div className="overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] transition-colors p-3 rounded-xl shadow-[0_2px_8px_oklch(0%_0_0_/_0.06)]">
								<div className="flex justify-between items-start mb-2">
									<span className="font-medium text-sm">{uni.university}</span>
									<span
										className={cn(
											"text-sm font-bold tabular-nums",
											totalAPS >= uni.minAPS
												? "text-success"
												: "text-destructive",
										)}
									>
										Min: {uni.minAPS}
									</span>
								</div>
								<div className="grid grid-cols-2 gap-2 text-xs">
									<div
										className={
											totalAPS >= uni.courses.medicine
												? "text-success"
												: "text-muted-foreground"
										}
									>
										Medicine: {uni.courses.medicine}+
									</div>
									<div
										className={
											totalAPS >= uni.courses.engineering
												? "text-success"
												: "text-muted-foreground"
										}
									>
										Engineering: {uni.courses.engineering}+
									</div>
									<div
										className={
											totalAPS >= uni.courses.commerce
												? "text-success"
												: "text-muted-foreground"
										}
									>
										Commerce: {uni.courses.commerce}+
									</div>
									<div
										className={
											totalAPS >= uni.courses.science
												? "text-success"
												: "text-muted-foreground"
										}
									>
										Science: {uni.courses.science}+
									</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</div>
	);
}

import { motion } from "framer-motion";
