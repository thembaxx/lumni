"use client";

import { Search01Icon, UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "framer-motion";
import { useState } from "react";
import {
	Empty,
	EmptyDescription,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type ExamResult,
	examYears,
	mockExamResults,
} from "@/lib/data/mock-exam-results";
import { cn } from "@/lib/shared";

interface Result {
	name: string;
	examNumber: string;
	school: string;
	province: string;
	subjects: { name: string; percentage: number }[];
	overall: number;
}

export function ResultsSearch() {
	const [selectedYear, setSelectedYear] = useState(2025);
	const [searchQuery, setSearchQuery] = useState("");
	const [results, setResults] = useState<Result[]>([]);
	const [isSearching, setIsSearching] = useState(false);

	const handleSearch = () => {
		setIsSearching(true);
		const yearResults = mockExamResults[selectedYear] || [];
		const query = searchQuery.toLowerCase();
		const filtered = yearResults.filter((r) =>
			r.name.toLowerCase().includes(query),
		);
		setResults(filtered);
		setTimeout(() => setIsSearching(false), 500);
	};

	const getGrade = (percentage: number): string => {
		if (percentage >= 80) return "A";
		if (percentage >= 70) return "B";
		if (percentage >= 60) return "C";
		if (percentage >= 50) return "D";
		if (percentage >= 40) return "E";
		return "F";
	};

	return (
		<div className="h-full flex flex-col overflow-y-auto">
			<div className="px-5 pt-5 pb-3">
				<h2 className="ios-title-3 flex items-center gap-2 text-[--system-text-primary]">
					<HugeiconsIcon
						icon={Search01Icon}
						className="size-5 text-[--system-accent]"
					/>
					Results Search
				</h2>
				<p className="ios-subhead text-[--system-text-secondary] mt-1">
					Search past matric results by name and year.
				</p>
			</div>

			<div className="px-5 pb-5">
				<div className="bg-system-background-secondary rounded-2xl p-5 space-y-4">
					<div>
						<Label className="mb-2 text-sm">Year</Label>
						<div className="flex gap-2 overflow-x-auto pb-1">
							{examYears.map((year) => (
								<Button
									key={year}
									variant={selectedYear === year ? "default" : "ghost"}
									onClick={() => {
										setSelectedYear(year);
										setResults([]);
										setSearchQuery("");
									}}
								>
									{year}
								</Button>
							))}
						</div>
					</div>

					<div className="flex gap-2">
						<div className="relative flex-1">
							<HugeiconsIcon
								icon={Search01Icon}
								className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
							/>
							<Input
								placeholder="Search by name…"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								onKeyDown={(e) => e.key === "Enter" && handleSearch()}
								className="pl-10 rounded-xl"
							/>
						</div>
						<Button onClick={handleSearch} className="rounded-xl">
							Search
						</Button>
					</div>
				</div>
			</div>

			{isSearching ? (
				<div className="flex-1 flex items-center justify-center">
					<div className="animate-spin size-8 border-2 border-[--system-accent] border-t-transparent rounded-full" />
				</div>
			) : results.length > 0 ? (
				<div className="px-5 pb-10 flex flex-col gap-4 flex-1">
					<p className="text-sm text-muted-foreground">
						{results.length} results found
					</p>
					{results.map((result, idx) => (
						<motion.div
							key={result.examNumber}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: idx * 0.05 }}
						>
							<Card className="p-4 rounded-xl shadow-sm border-border">
								<div className="flex items-start gap-3 mb-3">
									<div className="size-10 rounded-xl bg-[--system-accent]/10 flex items-center justify-center">
										<HugeiconsIcon
											icon={UserIcon}
											className="size-5 text-foreground"
										/>
									</div>
									<div>
										<h3 className="font-semibold">{result.name}</h3>
										<p className="text-xs text-muted-foreground">
											{result.school}, {result.province}
										</p>
										<p className="text-xs text-muted-foreground tabular-nums">
											Exam No: {result.examNumber}
										</p>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-2 mb-3">
									{result.subjects.map((subj) => (
										<div
											key={subj.name}
											className="flex justify-between text-sm p-2.5 rounded-lg bg-system-background-secondary"
										>
											<span className="text-muted-foreground">{subj.name}</span>
											<span className="font-medium tabular-nums">
												{subj.percentage}% ({getGrade(subj.percentage)})
											</span>
										</div>
									))}
								</div>

								<div className="flex justify-between items-center pt-2 border-t border-border">
									<span className="text-sm text-muted-foreground">Overall</span>
									<span className="text-lg font-extrabold tabular-nums">
										{result.overall}%
									</span>
								</div>
							</Card>
						</motion.div>
					))}
				</div>
			) : searchQuery ? (
				<div className="px-5 pb-10">
					<Empty className="border-none">
						<EmptyMedia>
							<HugeiconsIcon
								icon={Search01Icon}
								className="size-12 text-muted-foreground"
							/>
						</EmptyMedia>
						<EmptyTitle>No results found for "{searchQuery}"</EmptyTitle>
						<EmptyDescription>
							Try searching with a different name
						</EmptyDescription>
					</Empty>
				</div>
			) : (
				<div className="px-5 pb-10">
					<Empty className="border-none">
						<EmptyMedia>
							<HugeiconsIcon
								icon={Search01Icon}
								className="size-12 text-muted-foreground"
							/>
						</EmptyMedia>
						<EmptyTitle>Enter a name to search</EmptyTitle>
						<EmptyDescription>
							Search through {selectedYear} results
						</EmptyDescription>
					</Empty>
				</div>
			)}
		</div>
	);
}
