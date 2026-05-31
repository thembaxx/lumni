"use client";

import {
	ArrowDown01Icon,
	BookOpen01Icon,
	Cancel01Icon,
	Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useReducer } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Anim } from "@/components/shared/anim";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Input } from "@/components/ui/input";
import { useExams } from "@/hooks/use-exams";
import { cn } from "@/lib/shared";
import { ExamCard } from "./exam-card";
import { GroupSkeleton } from "./exam-card-skeleton";

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;

interface ExamTabProps {
	className?: string;
}

type ExamFiltersState = {
	selectedSubject: string | null;
	selectedYear: number | null;
	selectedSession: string;
	searchQuery: string;
	expandedGroups: Set<string>;
};

type ExamFiltersAction =
	| { type: "SET_SUBJECT"; payload: string | null }
	| { type: "SET_YEAR"; payload: number | null }
	| { type: "SET_SESSION"; payload: string }
	| { type: "SET_SEARCH"; payload: string }
	| { type: "TOGGLE_GROUP"; payload: string }
	| { type: "CLEAR_ALL" };

const initialFiltersState: ExamFiltersState = {
	selectedSubject: null,
	selectedYear: null,
	selectedSession: "all",
	searchQuery: "",
	expandedGroups: new Set(),
};

function filtersReducer(
	state: ExamFiltersState,
	action: ExamFiltersAction,
): ExamFiltersState {
	switch (action.type) {
		case "SET_SUBJECT":
			return { ...state, selectedSubject: action.payload };
		case "SET_YEAR":
			return { ...state, selectedYear: action.payload };
		case "SET_SESSION":
			return { ...state, selectedSession: action.payload };
		case "SET_SEARCH":
			return { ...state, searchQuery: action.payload };
		case "TOGGLE_GROUP": {
			const next = new Set(state.expandedGroups);
			if (next.has(action.payload)) {
				next.delete(action.payload);
			} else {
				next.add(action.payload);
			}
			return { ...state, expandedGroups: next };
		}
		case "CLEAR_ALL":
			return { ...initialFiltersState, expandedGroups: new Set() };
		default:
			return state;
	}
}

export function ExamTab({ className }: ExamTabProps) {
	const [filters, dispatch] = useReducer(filtersReducer, initialFiltersState);
	const {
		selectedSubject,
		selectedYear,
		selectedSession,
		searchQuery,
		expandedGroups,
	} = filters;

	const { exams, groupedExams, isLoading, error } = useExams({
		search: searchQuery,
		year: selectedYear,
		subject: selectedSubject,
		session: selectedSession,
	});

	const handleSubjectSelect = (subject: string) => {
		dispatch({ type: "SET_SUBJECT", payload: subject });
	};

	const handleYearSelect = (year: number | null) => {
		dispatch({ type: "SET_YEAR", payload: year });
	};

	const clearFilters = () => {
		dispatch({ type: "CLEAR_ALL" });
	};

	const hasActiveFilters =
		selectedSubject || selectedYear || selectedSession !== "all" || searchQuery;

	return (
		<Anim>
			<div
				className={cn("flex h-full w-full flex-col gap-8 px-4 pb-6", className)}
			>
				<m.div
					initial={{ opacity: 0, y: -10 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.3, ease: "easeOut" }}
					className="flex flex-col gap-6"
				>
					<div className="relative flex flex-col gap-4 rounded-2xl border shadow-sm">
						<HugeiconsIcon
							icon={Search01Icon}
							className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/60"
						/>
						<Input
							type="text"
							placeholder="Search exams..."
							value={searchQuery}
							onChange={(e) =>
								dispatch({ type: "SET_SEARCH", payload: e.target.value })
							}
							className="h-10 rounded-full border-0 bg-secondary/50 pr-10 pl-10 placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[--system-accent]/30"
						/>
						<AnimatePresence initial={false}>
							{searchQuery && (
								<m.div
									initial={{ opacity: 0, scale: 0.8 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.8 }}
									className="absolute top-1/2 right-3 -translate-y-1/2"
								>
									<Button
										onClick={() =>
											dispatch({ type: "SET_SEARCH", payload: "" })
										}
										variant="ghost"
										size="icon"
										className="rounded-full bg-muted/60 text-muted-foreground transition-[scale] hover:bg-muted hover:text-foreground active:scale-[0.96]"
									>
										<HugeiconsIcon icon={Cancel01Icon} data-icon />
									</Button>
								</m.div>
							)}
						</AnimatePresence>
					</div>

					<div className="flex flex-wrap items-center justify-between gap-2">
						<SubjectsDrawer onSelect={handleSubjectSelect}>
							<Button
								variant={selectedSubject ? "default" : "secondary"}
								size="sm"
								className="border"
							>
								{selectedSubject || "Subject"}
								<HugeiconsIcon
									icon={ArrowDown01Icon}
									className="ml-1"
									data-icon
								/>
							</Button>
						</SubjectsDrawer>

						<ButtonGroup className="h-9 rounded-full border">
							<Button
								variant={selectedSession === "all" ? "default" : "secondary"}
								size="sm"
								onClick={() =>
									dispatch({ type: "SET_SESSION", payload: "all" })
								}
							>
								All
							</Button>
							<Button
								variant={selectedSession === "may" ? "default" : "secondary"}
								size="sm"
								onClick={() =>
									dispatch({ type: "SET_SESSION", payload: "may" })
								}
							>
								Jun
							</Button>
							<Button
								variant={selectedSession === "nov" ? "default" : "secondary"}
								size="sm"
								onClick={() =>
									dispatch({ type: "SET_SESSION", payload: "nov" })
								}
							>
								Nov
							</Button>
						</ButtonGroup>

						<AnimatePresence initial={false}>
							{hasActiveFilters && (
								<m.div
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									exit={{ opacity: 0, scale: 0.9 }}
								>
									<Button
										onClick={clearFilters}
										variant="ghost"
										size="sm"
										className="text-muted-foreground transition-[scale] hover:text-foreground active:scale-[0.96]"
									>
										<HugeiconsIcon icon={Cancel01Icon} data-icon />
									</Button>
								</m.div>
							)}
						</AnimatePresence>
					</div>

					<div className="scrollbar-hide -mx-4 flex items-center gap-1.5 overflow-x-auto px-4 pb-1">
						<Button
							variant={selectedYear === null ? "default" : "secondary"}
							size="sm"
							className="shrink-0"
							onClick={() => handleYearSelect(null)}
						>
							All
						</Button>
						{YEARS.map((year) => (
							<Button
								key={year}
								variant={selectedYear === year ? "default" : "secondary"}
								size="sm"
								className="shrink-0"
								onClick={() => handleYearSelect(year)}
							>
								{year}
							</Button>
						))}
					</div>
				</m.div>

				<AnimatePresence mode="wait" initial={false}>
					<div className="grow">
						{isLoading ? (
							<m.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								exit={{ opacity: 0 }}
								transition={{ staggerChildren: 0.08 }}
								className="flex grow flex-col gap-5"
							>
								<GroupSkeleton />
								<GroupSkeleton />
								<GroupSkeleton />
							</m.div>
						) : error ? (
							<m.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								className="grow"
							>
								<Empty className="border border-destructive/30 border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<HugeiconsIcon
												icon={BookOpen01Icon}
												className="size-6 text-destructive"
											/>
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
								className="grow"
							>
								<Empty className="border border-dashed">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<HugeiconsIcon
												icon={BookOpen01Icon}
												className="size-8 text-muted-foreground/40"
											/>
										</EmptyMedia>
										<EmptyTitle className="text-base">
											No exams found
										</EmptyTitle>
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
								className="flex grow flex-col gap-5"
							>
								{groupedExams.map((group, groupIndex) => (
									<m.div
										key={group.subject}
										initial={{ opacity: 0, y: 8 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{ delay: groupIndex * 0.08 }}
										className="flex flex-col gap-2.5"
									>
										<div className="flex items-center justify-between gap-4 px-0.5">
											<h3 className="text-pretty font-semibold text-foreground text-lg">
												{group.subject}
											</h3>
											<Badge
												variant="secondary"
												className="px-2 py-0 font-medium text-[10px]"
											>
												{group.papers.length}
											</Badge>
										</div>
										<div className="grid gap-2">
											{(expandedGroups.has(group.subject)
												? group.papers
												: group.papers.slice(0, 4)
											).map((exam, _examIndex) => (
												<ExamCard key={exam.id} exam={exam} />
											))}
											{group.papers.length > 4 && (
												<Button
													variant="secondary"
													size="sm"
													onClick={() =>
														dispatch({
															type: "TOGGLE_GROUP",
															payload: group.subject,
														})
													}
												>
													{expandedGroups.has(group.subject)
														? "Show less"
														: `+${group.papers.length - 4} more`}
												</Button>
											)}
										</div>
									</m.div>
								))}
							</m.div>
						)}
					</div>
				</AnimatePresence>
			</div>
		</Anim>
	);
}
