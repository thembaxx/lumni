"use client";

import {
	BookOpen01Icon,
	Cancel01Icon,
	Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useState } from "react";
import { ExamCard } from "@/components/dashboard/practice/exam-card";
import { GroupSkeleton } from "@/components/dashboard/practice/exam-card-skeleton";
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

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;
const LANGUAGES = ["all", "english", "afrikaans"] as const;

export function ExamsBrowse() {
	const [selectedSubject, setSelectedSubject] = useState<string>("");
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [selectedSession, setSelectedSession] = useState<string>("all");
	const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
	const [searchQuery, setSearchQuery] = useState("");

	const { exams, groupedExams, isLoading, error } = useExams({
		search: searchQuery,
		year: selectedYear,
		subject: selectedSubject,
		session: selectedSession,
		language: selectedLanguage !== "all" ? selectedLanguage : undefined,
	});

	const clearFilters = () => {
		setSelectedSubject("");
		setSelectedYear(null);
		setSelectedSession("all");
		setSelectedLanguage("all");
		setSearchQuery("");
	};

	const hasActiveFilters =
		selectedSubject ||
		selectedYear ||
		selectedSession !== "all" ||
		selectedLanguage !== "all" ||
		searchQuery;

	return (
		<div className="min-h-[100dvh] bg-system-grouped pt-4 pb-24">
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4">
				<Anim>
					<div className="flex flex-col gap-6">
						<h1 className="ios-title-1 font-semibold text-foreground tracking-tight">
							Past Exam Papers
						</h1>

						<div className="relative flex flex-col gap-4">
							<div className="relative">
								<HugeiconsIcon
									icon={Search01Icon}
									className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground/60"
								/>
								<Input
									type="text"
									placeholder="Search exams…"
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="h-10 rounded-full border-0 bg-secondary/50 pr-10 pl-10 text-sm placeholder:text-muted-foreground/60 focus-visible:ring-1 focus-visible:ring-[--system-accent]/30"
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
												onClick={() => setSearchQuery("")}
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
								<div className="flex items-center gap-2">
									<ButtonGroup className="h-9 rounded-full border">
										{LANGUAGES.map((lang) => (
											<Button
												key={lang}
												variant={
													selectedLanguage === lang ? "default" : "secondary"
												}
												size="sm"
												onClick={() => setSelectedLanguage(lang)}
											>
												{lang === "all"
													? "All"
													: lang === "english"
														? "EN"
														: "AF"}
											</Button>
										))}
									</ButtonGroup>
								</div>

								<ButtonGroup className="h-9 rounded-full border">
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
											<EmptyTitle>We hit a little snag</EmptyTitle>
											<EmptyDescription>
												We couldn&apos;t fetch your exams right now. Let&apos;s
												give it another shot!
											</EmptyDescription>
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
												No exams here… yet!
											</EmptyTitle>
											<EmptyDescription>
												{hasActiveFilters
													? "Try tweaking your filters to find what you&apos;re looking for."
													: "We&apos;re still gathering exams for you. Check back soon!"}
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
												{group.papers.slice(0, 4).map((exam, _examIndex) => (
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
