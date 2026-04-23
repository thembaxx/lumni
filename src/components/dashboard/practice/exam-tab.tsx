"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
	ArrowDown01Icon,
	BookOpen,
	Calendar,
	ChevronDown,
	Download,
	FileText,
	Search,
	X,
} from "lucide-react";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
import { Input } from "@/components/ui/input";
import { useExams } from "@/lib/hooks/use-exams";
import { cn } from "@/lib/utils";
import type { ExamPaper } from "@/types/exam";

const YEARS = [2025, 2024, 2023, 2022, 2021] as const;

interface ExamTabProps {
	className?: string;
}

export function ExamTab({ className }: ExamTabProps) {
	const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
	const [selectedYear, setSelectedYear] = useState<number | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	const { exams, groupedExams, isLoading, error } = useExams({
		search: searchQuery,
		year: selectedYear,
		subject: selectedSubject,
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
		setSearchQuery("");
	};

	const hasActiveFilters = selectedSubject || selectedYear || searchQuery;

	return (
		<div className={cn("w-full px-4 pb-6 space-y-5", className)}>
			<motion.div
				initial={{ opacity: 0, y: -10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.25, 0.4, 0.25, 1] }}
				className="space-y-4"
			>
				<div className="relative">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search exam papers..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className="w-full h-11 pl-11 pr-11 rounded-xl bg-secondary/60 backdrop-blur-sm border border-border/60 text-foreground placeholder-muted-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background transition-all duration-200"
					/>
					<AnimatePresence>
						{searchQuery && (
							<motion.button
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.8 }}
								onClick={() => setSearchQuery("")}
								className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-200"
							>
								<X className="w-3.5 h-3.5" />
							</motion.button>
						)}
					</AnimatePresence>
				</div>

				<div className="flex items-center gap-2.5">
					<SubjectsDrawer onSelect={handleSubjectSelect}>
						<motion.button
							whileHover={{ scale: 1.02 }}
							whileTap={{ scale: 0.98 }}
							className={cn(
								"h-9 rounded-lg pl-4 pr-3.5 border border-border/60 bg-secondary/50 backdrop-blur-sm text-sm font-medium transition-all duration-200",
								selectedSubject &&
									"bg-primary/10 border-primary/30 text-primary",
							)}
						>
							<div className="flex items-center gap-2">
								<span className="text-xs">
									{selectedSubject || "All Subjects"}
								</span>
								<ChevronDown className="w-3.5 h-3.5" />
							</div>
						</motion.button>
					</SubjectsDrawer>

					<AnimatePresence>
						{hasActiveFilters && (
							<motion.button
								initial={{ opacity: 0, scale: 0.9 }}
								animate={{ opacity: 1, scale: 1 }}
								exit={{ opacity: 0, scale: 0.9 }}
								onClick={clearFilters}
								className="h-9 px-3 flex items-center justify-center rounded-lg bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200"
							>
								<X className="w-4 h-4" />
							</motion.button>
						)}
					</AnimatePresence>
				</div>

				<div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
					<motion.button
						key="all-years"
						onClick={() => handleYearSelect(null)}
						className={cn(
							"shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-all duration-200",
							selectedYear === null
								? "bg-foreground text-background"
								: "bg-muted/60 hover:bg-muted text-muted-foreground",
						)}
					>
						All
					</motion.button>
					{YEARS.map((year) => (
						<motion.button
							key={year}
							onClick={() => handleYearSelect(year)}
							whileHover={{ scale: 1.05 }}
							whileTap={{ scale: 0.95 }}
							className={cn(
								"shrink-0 h-8 px-4 rounded-full text-xs font-medium transition-all duration-200",
								selectedYear === year
									? "bg-foreground text-background"
									: "bg-muted/60 hover:bg-muted text-muted-foreground",
							)}
						>
							{year}
						</motion.button>
					))}
				</div>
			</motion.div>

			<AnimatePresence mode="wait">
				{isLoading ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className="flex items-center justify-center py-16"
					>
						<div className="flex flex-col items-center gap-3">
							<div className="w-8 h-8 rounded-full border-2 border-muted border-t-foreground animate-spin" />
							<p className="text-muted-foreground text-sm">
								Loading exam papers...
							</p>
						</div>
					</motion.div>
				) : error ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Empty className="border border-dashed border-destructive/30">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<FileText className="w-8 h-8 text-destructive" />
								</EmptyMedia>
								<EmptyTitle>Failed to load exams</EmptyTitle>
								<EmptyDescription>
									There was an error loading the exam papers.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					</motion.div>
				) : exams.length === 0 ? (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
					>
						<Empty className="border border-dashed">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<BookOpen className="w-10 h-10" />
								</EmptyMedia>
								<EmptyTitle>No exams found</EmptyTitle>
								<EmptyDescription>
									{hasActiveFilters
										? "Try adjusting your filters or search query"
										: "No exam papers available yet."}
								</EmptyDescription>
							</EmptyHeader>
							{hasActiveFilters && (
								<EmptyContent>
									<Button variant="outline" size="sm" onClick={clearFilters}>
										Clear filters
									</Button>
								</EmptyContent>
							)}
						</Empty>
					</motion.div>
				) : (
					<motion.div
						initial="hidden"
						animate="visible"
						transition={{ staggerChildren: 0.12 }}
						className="space-y-6"
					>
						{groupedExams.map((group, groupIndex) => (
							<motion.div
								key={group.subject}
								initial="hidden"
								animate="visible"
								transition={{ delay: groupIndex * 0.12, duration: 0.5 }}
								className="space-y-3"
							>
								<div className="flex items-center justify-between px-1">
									<h3 className="text-base font-semibold text-foreground tracking-tight">
										{group.subject}
									</h3>
									<Badge
										variant="secondary"
										className="text-[11px] font-medium px-2.5 py-0.5 rounded-full"
									>
										{group.papers.length}
									</Badge>
								</div>
								<div className="grid gap-2.5">
									{group.papers.slice(0, 6).map((exam, examIndex) => (
										<ExamCard key={exam.id} exam={exam} delay={examIndex} />
									))}
									{group.papers.length > 6 && (
										<motion.button
											initial={{ opacity: 0 }}
											animate={{ opacity: 1 }}
											transition={{ delay: 0.3 }}
											className="w-full h-10 rounded-lg bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-sm font-medium transition-all duration-200"
										>
											+{group.papers.length - 6} more {group.subject} papers
										</motion.button>
									)}
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}

function ExamCard({ exam, delay = 0 }: { exam: ExamPaper; delay?: number }) {
	const [isHovered, setIsHovered] = useState(false);

	const handleDownload = () => {
		if (exam.localPath) {
			window.open(exam.localPath, "_blank");
		} else {
			window.open(exam.url, "_blank");
		}
	};

	return (
		<motion.button
			initial="hidden"
			animate="visible"
			transition={{ delay: delay * 0.05, duration: 0.4 }}
			onClick={handleDownload}
			onMouseEnter={() => setIsHovered(true)}
			onMouseLeave={() => setIsHovered(false)}
			whileHover={{ scale: 1.01, y: -2 }}
			whileTap={{ scale: 0.99 }}
			onMouseMove={(e) => {
				const rect = e.currentTarget.getBoundingClientRect();
				const x = e.clientX - rect.left - rect.width / 2;
				const y = e.clientY - rect.top - rect.height / 2;
				e.currentTarget.style.setProperty("--x", `${x / rect.width}`);
				e.currentTarget.style.setProperty("--y", `${y / rect.height}`);
			}}
			style={
				{
					"--x": 0,
					"--y": 0,
				} as React.CSSProperties
			}
			className="relative w-full flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-secondary/40 to-secondary/20 hover:from-secondary/60 hover:to-secondary/40 border border-border/40 hover:border-border/80 transition-all duration-300 text-left group overflow-hidden"
		>
			<div
				className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
				style={{
					background: `radial-gradient(circle at calc(50% + var(--x) * 50% + 50%) calc(50% + var(--y) * 50% + 50%), rgba(255,255,255,0.08) 0%, transparent 60%)`,
				}}
			/>
			<div className="relative z-10 flex-1 min-w-0">
				<p className="text-sm font-medium text-foreground truncate pr-2">
					{exam.title}
				</p>
				<div className="flex items-center gap-2 mt-1.5">
					<span className="text-xs text-muted-foreground font-medium">
						{exam.year}
					</span>
					<span className="text-xs text-muted-foreground/50">•</span>
					<span
						className={cn(
							"text-[11px] px-2 py-0.5 rounded-md font-medium",
							exam.session === "november"
								? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
								: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
						)}
					>
						{exam.session === "november" ? "Nov" : "May/Jun"}
					</span>
					{exam.language && (
						<>
							<span className="text-xs text-muted-foreground/50">•</span>
							<span className="text-xs text-muted-foreground capitalize font-medium">
								{exam.language}
							</span>
						</>
					)}
				</div>
			</div>
			<div className="relative z-10 flex items-center gap-2 ml-3">
				{exam.downloadedAt ? (
					<Badge
						variant="outline"
						className="text-[10px] h-5.5 px-2 text-muted-foreground border-border/60"
					>
						<Download className="w-3 h-3 mr-1" />
						Saved
					</Badge>
				) : (
					<motion.div
						animate={{ scale: isHovered ? 1.1 : 1 }}
						transition={{ duration: 0.2 }}
					>
						<Download className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
					</motion.div>
				)}
			</div>
		</motion.button>
	);
}

export default ExamTab;
