"use client";

import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { BookOpen, Search, X } from "lucide-react";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useExams } from "@/hooks/use-exams";
import { cn } from "@/lib/utils";
import { ExamCard } from "./exam-card";

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;

interface ExamTabProps {
	className?: string;
}

export function ExamTab({ className }: ExamTabProps) {
	const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [selectedSession, setSelectedSession] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const { exams, groupedExams, isLoading, error } = useExams({
		search: searchQuery,
		year: selectedYear,
		subject: selectedSubject,
		session: selectedSession,
	});

	const handleSubjectSelect = (subject: string) => {
		setSelectedSubject(subject);
	};

	const handleYearSelect = (year: number | null) => {
		setSelectedYear(year);
	};

	const clearFilters = () => {
		setSelectedSubject(null);
		setSelectedYear(null);
		setSelectedSession("all");
		setSearchQuery("");
	};

	const hasActiveFilters =
		selectedSubject || selectedYear || selectedSession !== "all" || searchQuery;

	return (
		<LazyMotion features={domAnimation}>
			<div className={cn("w-full px-4 pb-6 space-y-8", className)}>
				<m.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
					className="space-y-3"
				>
					<div className="relative">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
						<Input
							type="text"
							placeholder="Search exams..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 pl-10 pr-10 rounded-full bg-secondary/50 border-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-primary/30"
						/>
						<AnimatePresence>
							{searchQuery && (
								<m.button
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									onClick={() => setSearchQuery("")}
									className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground"
									type="button"
								>
									<X className="w-3 h-3" />
								</m.button>
							)}
						</AnimatePresence>
					</div>

					<div className="flex items-center justify-between gap-2">
						<SubjectsDrawer onSelect={handleSubjectSelect}>
							<Button
								variant={selectedSubject ? "default" : "secondary"}
								size="sm"
								className="h-7"
							>
								{selectedSubject || "Subject"}
							</Button>
						</SubjectsDrawer>

						<ButtonGroup>
							<Button
								variant={selectedSession === "all" ? "default" : "secondary"}
								size="sm"
								onClick={() => setSelectedSession("all")}
							>
								All
							</Button>
							<Button
								variant={selectedSession === "may" ? "default" : "secondary"}
								size="sm"
								onClick={() => setSelectedSession("may")}
							>
								May/Jun
							</Button>
							<Button
								variant={selectedSession === "nov" ? "default" : "secondary"}
								size="sm"
								onClick={() => setSelectedSession("nov")}
							>
								Nov/Dec
							</Button>
						</ButtonGroup>

						<AnimatePresence>
							{hasActiveFilters && (
								<m.button
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
									onClick={clearFilters}
									className="h-7 px-2.5 flex items-center text-xs text-muted-foreground hover:text-foreground"
									type="button"
								>
									<X className="w-3.5 h-3.5" />
								</m.button>
							)}
						</AnimatePresence>
					</div>

					<div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
						<Button
							variant={selectedYear === null ? "default" : "secondary"}
							size="sm"
							className="shrink-0 h-7 text-xs font-medium"
							onClick={() => handleYearSelect(null)}
						>
							All
						</Button>
						{YEARS.map((year) => (
							<Button
								key={year}
								variant={selectedYear === year ? "default" : "secondary"}
								size="sm"
								className="shrink-0 h-7 text-xs font-medium"
								onClick={() => handleYearSelect(year)}
							>
								{year}
							</Button>
						))}
					</div>
				</m.div>

				<AnimatePresence mode="wait">
					{isLoading ? (
						<m.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="flex items-center justify-center py-12"
						>
							<div className="flex flex-col items-center gap-2">
								<div className="w-5 h-5 rounded-full border border-muted border-t-foreground animate-spin" />
								<p className="text-xs text-muted-foreground">Loading...</p>
							</div>
						</m.div>
					) : error ? (
						<m.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<Empty className="border border-dashed border-destructive/30">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<BookOpen className="w-6 h-6 text-destructive" />
									</EmptyMedia>
									<EmptyTitle>Failed to load</EmptyTitle>
									<EmptyDescription>Please try again.</EmptyDescription>
								</EmptyHeader>
							</Empty>
						</m.div>
					) : exams.length === 0 ? (
						<m.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
						>
							<Empty className="border border-dashed">
								<EmptyHeader>
									<EmptyMedia variant="icon">
										<BookOpen className="w-8 h-8 text-muted-foreground/40" />
									</EmptyMedia>
									<EmptyTitle className="text-base">No exams found</EmptyTitle>
									<EmptyDescription>
										{hasActiveFilters
											? "Try adjusting your filters"
											: "No exams available yet."}
									</EmptyDescription>
								</EmptyHeader>
								{hasActiveFilters && (
									<EmptyContent>
										<Button variant="link" size="sm" onClick={clearFilters}>
											Clear filters
										</Button>
									</EmptyContent>
								)}
							</Empty>
						</m.div>
					) : (
						<m.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ staggerChildren: 0.08 }}
							className="space-y-5"
						>
							{groupedExams.map((group, groupIndex) => (
								<m.div
									key={group.subject}
									initial={{ opacity: 0, y: 8 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: groupIndex * 0.08 }}
									className="space-y-2.5"
								>
									<div className="flex items-center justify-between px-0.5">
										<h3 className="text-sm font-semibold text-foreground">
											{group.subject}
										</h3>
										<Badge
											variant="secondary"
											className="text-[10px] font-medium px-2 py-0"
										>
											{group.papers.length}
										</Badge>
									</div>
									<div className="grid gap-2">
										{group.papers.slice(0, 4).map((exam, examIndex) => (
											<ExamCard key={exam.id} exam={exam} />
										))}
										{group.papers.length > 4 && (
											<Button
												variant="secondary"
												size="sm"
												className="h-9 text-xs"
											>
												+{group.papers.length - 4} more
											</Button>
										)}
									</div>
								</m.div>
							))}
						</m.div>
					)}
				</AnimatePresence>
			</div>
		</LazyMotion>
	);
}

export default ExamTab;
