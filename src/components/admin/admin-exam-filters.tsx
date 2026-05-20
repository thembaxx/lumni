"use client";

import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Subject {
	id: string;
	name: string;
	code: string;
	description?: string;
	category: string;
	color?: string;
}

interface ExamFiltersProps {
	selectedYear: number;
	onYearChange: (year: number) => void;
	selectedSubjects: Set<string>;
	subjects: Subject[];
	onToggleSubject: (id: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	selectedExamTypes: Set<string>;
	onToggleExamType: (type: string) => void;
	includeMemo: boolean;
	onIncludeMemoChange: (include: boolean) => void;
	isLoading: boolean;
}

const YEARS = [2021, 2022, 2023, 2024, 2025];

const EXAM_TYPES = [
	{ value: "june", label: "June/July" },
	{ value: "november", label: "November" },
];

const springTransition = {
	type: "spring" as const,
	stiffness: 300,
	damping: 25,
};

function AnimatedYearButton({
	year,
	selected,
	onClick,
}: {
	year: number;
	selected: boolean;
	onClick: () => void;
}) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: year * 0.03, ...springTransition }}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
		>
			<Button
				variant={selected ? "default" : "secondary"}
				size="sm"
				onClick={onClick}
				className="min-w-[60px]"
			>
				{year}
			</Button>
		</motion.div>
	);
}

function SubjectCheckboxItem({
	checked,
	onChange,
	label,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
}) {
	return (
		<motion.div
			className="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-muted/50"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			whileHover={{ backgroundColor: "oklch(0% 0 0 / 0.02)" }}
		>
			<Checkbox checked={checked} onCheckedChange={onChange} />
			<span>{label}</span>
		</motion.div>
	);
}

export function ExamFilters({
	selectedYear,
	onYearChange,
	selectedSubjects,
	subjects,
	onToggleSubject,
	onSelectAll,
	onDeselectAll,
	selectedExamTypes,
	onToggleExamType,
	includeMemo,
	onIncludeMemoChange,
	isLoading,
}: ExamFiltersProps) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Download01Icon Papers</CardTitle>
			</CardHeader>
			<CardContent className="flex flex-col gap-6">
				<div className="flex flex-col gap-3">
					<Label className="font-medium text-foreground text-sm">Year</Label>
					<div className="flex flex-wrap gap-1">
						{YEARS.map((year) => (
							<AnimatedYearButton
								key={year}
								year={year}
								selected={selectedYear === year}
								onClick={() => onYearChange(year)}
							/>
						))}
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<div className="flex items-center justify-between">
						<Label className="font-medium text-foreground text-sm">
							Subjects
						</Label>
						<motion.div
							initial={{ opacity: 0, scale: 0.8 }}
							animate={{ opacity: 1, scale: 1 }}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
						>
							<Button
								variant="ghost"
								size="sm"
								onClick={
									selectedSubjects.size === subjects.length
										? onDeselectAll
										: onSelectAll
								}
								className="font-medium text-foreground text-sm hover:underline"
							>
								{selectedSubjects.size === subjects.length
									? "Deselect all"
									: "Select all"}
							</Button>
						</motion.div>
					</div>
					<div className="max-h-48 divide-y overflow-y-auto rounded-lg border">
						{isLoading ? (
							<div className="flex items-center justify-center p-4">
								<HugeiconsIcon
									icon={RadialIcon}
									className="size-4 animate-spin text-muted-foreground"
								/>
							</div>
						) : (
							subjects.map((subject) => (
								<SubjectCheckboxItem
									key={subject.id}
									checked={selectedSubjects.has(subject.id)}
									onChange={() => onToggleSubject(subject.id)}
									label={subject.name}
								/>
							))
						)}
					</div>
				</div>

				<div className="flex flex-col gap-3">
					<Label className="font-medium text-foreground text-sm">
						Exam Type
					</Label>
					<div className="flex gap-1">
						{EXAM_TYPES.map((type) => (
							<motion.div
								key={type.value}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
							>
								<Button
									variant={
										selectedExamTypes.has(type.value) ? "default" : "secondary"
									}
									onClick={() => onToggleExamType(type.value)}
									className="flex-1"
								>
									{type.label}
								</Button>
							</motion.div>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between py-2">
					<div>
						<Label className="text-sm">Include Memo</Label>
						<p className="text-muted-foreground text-xs">
							With marking guidelines
						</p>
					</div>
					<Switch checked={includeMemo} onCheckedChange={onIncludeMemoChange} />
				</div>
			</CardContent>
		</Card>
	);
}
