"use client";

import { motion } from "framer-motion";
import { SearchIcon, UserIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	type ExamResult,
	examYears,
	mockExamResults,
} from "@/lib/data/mock-exam-results";
import { cn } from "@/lib/utils";

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
		<div className="p-4 h-full flex flex-col">
			<div className="space-y-4 mb-6">
				<div>
					<Label className="mb-2">Year</Label>
					<div className="flex gap-2 overflow-x-auto pb-2">
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
						<SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<Input
							placeholder="Search by name..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="pl-10 rounded-xl"
						/>
					</div>
					<Button
						onClick={handleSearch}
						className="rounded-xl active:scale-[0.96] transition-transform duration-150"
					>
						Search
					</Button>
				</div>
			</div>

			{isSearching ? (
				<div className="flex-1 flex items-center justify-center">
					<div className="animate-spin w-8 h-8 border-2 border-[--system-accent] border-t-transparent rounded-full" />
				</div>
			) : results.length > 0 ? (
				<div className="space-y-4 flex-1 overflow-y-auto">
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
							<Card className="p-4 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
								<div className="flex items-start gap-3 mb-3">
									<div className="w-10 h-10 rounded-xl bg-[--system-accent]/10 flex items-center justify-center shadow-[inset_0_2px_4px_rgba(0,0,0,0.06)]">
										<UserIcon className="w-5 h-5 text-foreground" />
									</div>
									<div>
										<h3 className="font-semibold text-wrap balance">
											{result.name}
										</h3>
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
											className="flex justify-between text-sm p-2.5 rounded-lg bg-muted"
										>
											<span className="text-muted-foreground">{subj.name}</span>
											<span className="font-medium tabular-nums">
												{subj.percentage}% ({getGrade(subj.percentage)})
											</span>
										</div>
									))}
								</div>

								<div className="flex justify-between items-center pt-2 border-t">
									<span className="text-sm text-muted-foreground">Overall</span>
									<span className="text-lg font-bold tabular-nums">
										{result.overall}%
									</span>
								</div>
							</Card>
						</motion.div>
					))}
				</div>
			) : searchQuery ? (
				<div className="flex-1 flex flex-col items-center justify-center text-center">
					<SearchIcon className="w-12 h-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground">
						No results found for "{searchQuery}"
					</p>
					<p className="text-sm text-muted-foreground mt-2">
						Try searching with a different name
					</p>
				</div>
			) : (
				<div className="flex-1 flex flex-col items-center justify-center text-center">
					<SearchIcon className="w-12 h-12 text-muted-foreground mb-4" />
					<p className="text-muted-foreground">Enter a name to search</p>
					<p className="text-sm text-muted-foreground mt-2">
						Search through {selectedYear} results
					</p>
				</div>
			)}
		</div>
	);
}
