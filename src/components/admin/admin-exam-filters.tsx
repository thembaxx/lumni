"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
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
		<motion.button
			key={year}
			onClick={onClick}
			whileHover={{ scale: 1.05 }}
			whileTap={{ scale: 0.95 }}
			className={cn(
				"px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
				selected
					? "bg-foreground text-background"
					: "bg-muted hover:bg-muted/80",
			)}
			initial={{ opacity: 0, scale: 0.8 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ delay: year * 0.03, ...springTransition }}
		>
			{year}
		</motion.button>
	);
}

function AnimatedCheckbox({
	checked,
	onChange,
}: {
	checked: boolean;
	onChange: () => void;
}) {
	return (
		<motion.label
			className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50 transition-colors"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			whileHover={{ backgroundColor: "rgba(0,0,0,0.02)" }}
		>
			<motion.div
				initial={false}
				animate={{
					backgroundColor: checked ? "var(--foreground)" : "transparent",
					borderColor: checked
						? "var(--foreground)"
						: "var(--muted-foreground)",
				}}
				className="w-4 h-4 rounded border flex items-center justify-center"
				transition={{ duration: 0.2 }}
			>
				<motion.div
					initial={{ scale: 0.95, opacity: 0 }}
					animate={{
						scale: checked ? 1 : 0,
						opacity: checked ? 1 : 0,
					}}
					transition={{ type: "spring", stiffness: 500, damping: 30 }}
				>
					<span className="text-background text-xs">✓</span>
				</motion.div>
			</motion.div>
			<input
				type="checkbox"
				checked={checked}
				onChange={onChange}
				className="sr-only"
			/>
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
						<motion.button
							onClick={
								selectedSubjects.size === subjects.length
									? onDeselectAll
									: onSelectAll
							}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className="text-sm font-medium text-primary hover:underline"
						>
							{selectedSubjects.size === subjects.length
								? "Deselect all"
								: "Select all"}
						</motion.button>
					</div>
					<div className="border rounded-lg divide-y max-h-48 overflow-y-auto">
						{isLoading ? (
							<div className="flex items-center justify-center p-4">
								<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
							</div>
						) : (
							subjects.map((subject) => (
								<div key={subject.id} className="flex items-center p-3">
									<AnimatedCheckbox
										checked={selectedSubjects.has(subject.id)}
										onChange={() => onToggleSubject(subject.id)}
									/>
									<span>{subject.name}</span>
								</div>
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
							<motion.button
								key={type.value}
								onClick={() => onToggleExamType(type.value)}
								whileHover={{ scale: 1.02 }}
								whileTap={{ scale: 0.98 }}
								className={cn(
									"flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
									selectedExamTypes.has(type.value)
										? "bg-foreground text-background"
										: "bg-muted hover:bg-muted/80",
								)}
							>
								{type.label}
							</motion.button>
						))}
					</div>
				</div>

				<div className="flex items-center justify-between py-2 cursor-pointer">
					<div>
						<Label className="text-sm">Include Memo</Label>
						<p className="text-xs text-muted-foreground">
							With marking guidelines
						</p>
					</div>
					<motion.button
						type="button"
						onClick={() => onIncludeMemoChange(!includeMemo)}
						whileTap={{ scale: 0.95 }}
						className={cn(
							"w-10 h-5 rounded-full transition-colors relative",
							includeMemo ? "bg-foreground" : "bg-muted",
						)}
					>
						<motion.div
							className="absolute top-0.5 w-4 h-4 rounded-full bg-background shadow-sm"
							animate={{
								left: includeMemo ? 20 : 4,
							}}
							transition={springTransition}
						/>
					</motion.button>
				</div>
			</CardContent>
		</Card>
	);
}
