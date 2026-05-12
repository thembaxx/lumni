"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

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
		<motion.label
			className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			whileHover={{ backgroundColor: "oklch(0% 0 0 / 0.02)" }}
		>
			<Checkbox checked={checked} onCheckedChange={onChange} />
			<span>{label}</span>
		</motion.label>
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
			<CardHeader className="pb-3">
				<CardTitle className="text-base text-foreground">
					Download Papers
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="space-y-3">
					<Label className="text-sm font-medium text-foreground">Year</Label>
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

				<div className="space-y-3">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium text-foreground">
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
								className="text-sm font-medium text-foreground hover:underline"
							>
								{selectedSubjects.size === subjects.length
									? "Deselect all"
									: "Select all"}
							</Button>
						</motion.div>
					</div>
					<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
						{isLoading ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
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

				<div className="space-y-3">
					<Label className="text-sm font-medium text-foreground">
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
						<p className="text-xs text-muted-foreground">
							With marking guidelines
						</p>
					</div>
					<Switch checked={includeMemo} onCheckedChange={onIncludeMemoChange} />
				</div>
			</CardContent>
		</Card>
	);
}
