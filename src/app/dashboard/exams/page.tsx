"use client";

import { ArrowDown01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { BookOpen, Search, X } from "lucide-react";
import { useState } from "react";
import { ExamCard } from "@/components/dashboard/practice/exam-card";
import { GroupSkeleton } from "@/components/dashboard/practice/exam-card-skeleton";
import { Anim } from "@/components/shared/anim";
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
import { SubjectSelect } from "@/components/ui/subject-select";
import { useExams } from "@/hooks/use-exams";

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;

export default function ExamsPage() {
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [selectedSession, setSelectedSession] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const { exams, groupedExams, isLoading, error } = useExams({
		search: searchQuery,
		year: selectedYear,
		subject: selectedSubject,
		session: selectedSession,
	});

	const clearFilters = () => {
		setSelectedSubject("");
		setSelectedYear(null);
		setSelectedSession("all");
		setSearchQuery("");
	};

	const hasActiveFilters =
		selectedSubject || selectedYear || selectedSession !== "all" || searchQuery;

	return (
		<div className="min-h-[100dvh] bg-system-grouped pt-4 pb-24">
			<div className="max-w-3xl mx-auto w-full px-4 flex flex-col gap-8">
				<Anim>
					<div className="flex flex-col gap-6">
						<h1 className="ios-title-1 font-bold text-foreground tracking-tight">
							Past Exam Papers
						</h1>

						<div className="relative flex flex-col gap-4">
							<div className="relative">
								<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/60" />
								<Input
									type="text"
									placeholder="Search exams..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-10 pl-10 pr-10 rounded-full bg-secondary/50 border-0 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[--system-accent]/30"
								/>
								<AnimatePresence initial={false}>
									{searchQuery && (
										<m.div
											initial={{ opacity: 0, scale: 0.8 }}
											animate={{ opacity: 1, scale: 1 }}
											exit={{ opacity: 0, scale: 0.8 }}
											className="absolute right-3 top-1/2 -translate-y-1/2"
										>
											<Button
												onClick={() => setSearchQuery("")}
												variant="ghost"
												size="icon"
												className="rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground active:scale-[0.96] transition-[scale]"
											>
												<X data-icon />
											</Button>
										</m.div>
									)}
								</AnimatePresence>
							</div>

							<div className="flex items-center justify-between gap-2 flex-wrap">
								<SubjectSelect
									value={selectedSubject}
									onChange={setSelectedSubject}
									placeholder="Subject"
								/>

								<ButtonGroup className="border rounded-full h-9">
									<Button
										variant={
											selectedSession === "all" ? "default" : "secondary"
										}
										size="sm"
										onClick={() => setSelectedSession("all")}
									>
										All
									</Button>
									<Button
										variant={
											selectedSession === "may" ? "default" : "secondary"
										}
										size="sm"
										onClick={() => setSelectedSession("may")}
									>
										Jun
									</Button>
									<Button
										variant={
											selectedSession === "nov" ? "default" : "secondary"
										}
										size="sm"
										onClick={() => setSelectedSession("nov")}
									>
										Nov
									</Button>
								</ButtonGroup>

								<AnimatePresence initial={false}>
									{hasActiveFilters && (
										<m.div
											initial={{ opacity: 0, scale: 0.9 }}
											animate={{ opacity: 1, scale: 0.9 }}
											exit={{ opacity: 0, scale: 0.9 }}
										>
											<Button
												onClick={clearFilters}
												variant="ghost"
												size="sm"
												className="text-muted-foreground hover:text-foreground active:scale-[0.96] transition-[scale]"
											>
												<X data-icon />
											</Button>
										</m.div>
									)}
								</AnimatePresence>
							</div>

							<div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
								<Button
									variant={selectedYear === null ? "default" : "secondary"}
									size="sm"
									className="shrink-0"
									onClick={() => setSelectedYear(null)}
								>
									All
								</Button>
								{YEARS.map((year) => (
									<Button
										key={year}
										variant={selectedYear === year ? "default" : "secondary"}
										size="sm"
										className="shrink-0"
										onClick={() => setSelectedYear(year)}
									>
										{year}
									</Button>
								))}
							</div>
						</div>
					</div>

					<AnimatePresence mode="wait" initial={false}>
						<div className="grow">
							{isLoading ? (
								<m.div
									initial={{ opacity: 0 }}
									animate={{ opacity: 1 }}
									exit={{ opacity: 0 }}
									className="flex flex-col gap-5 grow"
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
									<Empty className="border border-dashed border-destructive/30">
										<EmptyHeader>
											<EmptyMedia variant="icon">
												<BookOpen className="size-6 text-destructive" />
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
												<BookOpen className="size-8 text-muted-foreground/40" />
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
									className="flex flex-col gap-5 grow"
								>
									{groupedExams.map((group, groupIndex) => (
										<m.div
											key={group.subject}
											initial={{ opacity: 0, y: 8 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: groupIndex * 0.08 }}
											className="flex flex-col gap-2.5"
										>
											<div className="flex items-center justify-between px-0.5 gap-4">
												<h3 className="text-lg font-semibold text-foreground text-pretty">
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
													<Button variant="secondary" size="sm">
														+{group.papers.length - 4} more
													</Button>
												)}
											</div>
										</m.div>
									))}
								</m.div>
							)}
						</div>
					</AnimatePresence>
				</Anim>
			</div>
		</div>
	);
}
