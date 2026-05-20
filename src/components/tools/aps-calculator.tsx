"use client";

import {
	Add01Icon,
	CalculatorIcon,
	CheckmarkCircle01Icon,
	Delete01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/shared";

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

	const addSubject = () => {
		setSubjects((prev) => [
			...prev,
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
			.reduce(
				(acc, score, idx) => {
					const isLO = validSubjects[idx].name
						.toLowerCase()
						.includes("life orientation");
					if (!isLO || includeLifeOrientation) {
						acc.push({ score, isLO });
					}
					return acc;
				},
				[] as Array<{ score: number; isLO: boolean }>,
			)
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
	const hasData = subjects.some((s) => s.percentage > 0);

	const scoreLevel =
		totalAPS >= 32 ? "high" : totalAPS >= 24 ? "medium" : "low";

	return (
		<div className="flex h-full flex-col overflow-y-auto">
			<div className="px-5 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					<HugeiconsIcon
						icon={CalculatorIcon}
						className="size-5 text-[--system-accent]"
					/>
					APS CalculatorIcon
				</h2>
				<p className="ios-subhead mt-1 text-[--system-text-secondary]">
					Calculate your Admission Point Score for university applications.
				</p>
			</div>

			<div className="px-5 pb-5">
				<div className="space-y-3 rounded-2xl bg-system-background-secondary p-5">
					{subjects.map((subject, index) => (
						<m.div
							key={subject.id}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: index * 0.05 }}
							className="flex items-center gap-2"
						>
							<Input
								placeholder="Subject name"
								value={subject.name}
								onChange={(e) =>
									updateSubject(subject.id, "name", e.target.value)
								}
								className="flex-1 rounded-xl"
							/>
							<div className="relative">
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
											parseInt(e.target.value, 10) || 0,
										)
									}
									className="w-20 rounded-xl pr-7 tabular-nums"
								/>
								<span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground text-xs">
									%
								</span>
							</div>
							<Button
								variant="ghost"
								size="icon-sm"
								onClick={() => removeSubject(subject.id)}
								disabled={subjects.length === 1}
								className="size-9"
							>
								<HugeiconsIcon icon={Delete01Icon} data-icon />
							</Button>
						</m.div>
					))}

					<div className="flex gap-2 pt-1">
						<Button
							variant="outline"
							onClick={addSubject}
							className="flex-1 rounded-xl"
						>
							<HugeiconsIcon icon={Add01Icon} data-icon className="mr-2" />
							Add Subject
						</Button>
						<Button
							variant={includeLifeOrientation ? "default" : "outline"}
							onClick={() => setIncludeLifeOrientation(!includeLifeOrientation)}
							className="rounded-xl"
						>
							{includeLifeOrientation && (
								<HugeiconsIcon
									icon={CheckmarkCircle01Icon}
									data-icon
									className="mr-1.5"
								/>
							)}
							Include LO
						</Button>
					</div>
				</div>
			</div>

			<div className="px-5 pb-5">
				<div className="rounded-2xl border border-border bg-card p-6 shadow-level-2">
					<div className="mb-3 flex items-center justify-between">
						<span className="ios-subhead text-[--system-text-secondary]">
							Your APS Score
						</span>
						<HugeiconsIcon
							icon={CalculatorIcon}
							className="size-5 text-[--system-accent]"
						/>
					</div>
					<div
						className={cn(
							"text-center font-extrabold text-5xl tabular-nums",
							scoreLevel === "high" && "text-success",
							scoreLevel === "medium" && "text-warning",
							scoreLevel === "low" && "text-destructive",
						)}
					>
						{totalAPS}
					</div>
					<div className="mt-4 h-2 overflow-hidden rounded-full bg-system-background-tertiary">
						<div
							className={cn(
								"h-full rounded-full transition-[width] duration-500",
								scoreLevel === "high" && "bg-success",
								scoreLevel === "medium" && "bg-warning",
								scoreLevel === "low" && "bg-destructive",
							)}
							style={{ width: `${(totalAPS / 42) * 100}%` }}
						/>
					</div>
					<p className="ios-caption-1 mt-3 text-center text-muted-foreground text-sm">
						Max possible: 42 points (6 subjects × 7)
					</p>
				</div>
			</div>

			{hasData && (
				<div className="px-5 pb-5">
					<p className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
						Subject Breakdown
					</p>
					<div className="flex flex-col gap-2">
						{subjects
							.filter((s) => s.percentage > 0)
							.sort(
								(a, b) =>
									getAPSForSubject(b.percentage) -
									getAPSForSubject(a.percentage),
							)
							.map((subject, idx) => {
								const aps = getAPSForSubject(subject.percentage);
								return (
									<m.div
										key={subject.id}
										initial={{ opacity: 0, y: 10 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: idx * 0.05 }}
										className="relative flex items-center justify-between overflow-hidden rounded-xl bg-system-background-secondary p-4"
									>
										<div
											className={cn(
												"absolute top-0 bottom-0 left-0 w-1.5",
												aps >= 6 && "bg-success",
												aps >= 4 && aps < 6 && "bg-warning",
												aps < 4 && "bg-destructive",
											)}
										/>
										<div className="pl-3">
											<span className="font-medium text-sm">
												{subject.name || `Subject ${idx + 1}`}
											</span>
											<span className="ml-2 text-muted-foreground text-sm tabular-nums">
												({subject.percentage}%)
											</span>
										</div>
										<div className="text-right">
											<span
												className={cn(
													"font-extrabold tabular-nums",
													aps >= 6 && "text-success",
													aps >= 4 && aps < 6 && "text-warning",
													aps < 4 && "text-destructive",
												)}
											>
												{aps} pts
											</span>
											<span className="ml-2 block text-muted-foreground text-xs">
												{getGrade(subject.percentage)}
											</span>
										</div>
									</m.div>
								);
							})}
					</div>
				</div>
			)}

			<div className="px-5 pb-10">
				<p className="mb-3 font-bold text-muted-foreground text-xs uppercase tracking-wider">
					University Requirements
				</p>
				<div className="flex flex-col gap-3">
					{universityRequirements.map((uni, idx) => {
						const meetsMin = totalAPS >= uni.minAPS;
						return (
							<m.div
								key={uni.university}
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: idx * 0.05 }}
								className="relative overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm"
							>
								{meetsMin && (
									<div className="absolute top-0 bottom-0 left-0 w-1 rounded-r-full bg-success" />
								)}
								<div className="mb-3 flex items-start justify-between">
									<span className="font-medium text-sm">{uni.university}</span>
									<span
										className={cn(
											"font-extrabold text-sm tabular-nums",
											meetsMin ? "text-success" : "text-destructive",
										)}
									>
										Min: {uni.minAPS}
									</span>
								</div>
								<div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
									{Object.entries(uni.courses).map(([course, req]) => (
										<span
											key={course}
											className={
												totalAPS >= req
													? "text-success capitalize"
													: "text-muted-foreground capitalize"
											}
										>
											{course}: {req}+
										</span>
									))}
								</div>
							</m.div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
