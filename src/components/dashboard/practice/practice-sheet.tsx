"use client";

import { Cancel01Icon, More01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusTab } from "../focus/focus-tab";
import { ExamTab } from "./exam-tab";
import { QuizTab } from "./quiz-tab";
import StatsTab from "./stats-tab";

interface PracticeSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PracticeSheet({ open, onOpenChange }: PracticeSheetProps) {
	const [showQuizHeader, setShowQuizHeader] = useState(true);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger
				className="rounded-lg h-10 w-10 flex items-center justify-center bg-system-surface shadow-sm border border-border/40 text-foreground hover:bg-secondary transition-all active:scale-[0.95]"
				aria-label="Open practice sheet"
			>
				<HugeiconsIcon
					icon={More01Icon}
					className="w-4 h-4 text-system-accent"
				/>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="min-h-[95dvh] h-full flex flex-col max-h-[95dvh] w-full mt-0 rounded-t-3xl! bg-system-grouped/95 backdrop-blur-xl border-t border-border/20 animate-fade-in-scale"
			>
				<SheetHeader className="relative flex flex-row items-center justify-center pr-12 pt-2">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onOpenChange(false)}
						className="absolute right-0 rounded-full hover:bg-secondary"
						aria-label="Close practice sheet"
					>
						<HugeiconsIcon
							icon={Cancel01Icon}
							className="w-5 h-5 text-muted-foreground"
						/>
					</Button>
					<SheetTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">
						Practice
					</SheetTitle>
				</SheetHeader>
				<div
					className={`px-4 py-4 w-full grow flex flex-col items-center overflow-y-auto`}
				>
					<Tabs
						defaultValue="quiz"
						className="flex flex-col items-center w-full h-full"
					>
						<TabsList
							className={`h-11 p-1 bg-secondary/50 dark:bg-secondary/20 transition-all duration-300 rounded-lg ${
								showQuizHeader
									? "opacity-100 translate-y-0"
									: "opacity-0 -translate-y-4 pointer-events-none absolute"
							}`}
						>
							<TabsTrigger
								value="quiz"
								className="px-5 font-bold text-xs uppercase tracking-tight"
							>
								Quiz
							</TabsTrigger>
							<TabsTrigger
								value="exam"
								className="px-5 font-bold text-xs uppercase tracking-tight"
							>
								Exam
							</TabsTrigger>
							<TabsTrigger
								value="focus"
								className="px-5 font-bold text-xs uppercase tracking-tight"
							>
								Focus
							</TabsTrigger>
							<TabsTrigger
								value="stats"
								className="px-5 font-bold text-xs uppercase tracking-tight"
							>
								Stats
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="quiz"
							className="mt-6 grow flex flex-col w-full items-center justify-center animate-fade-in-up"
						>
							<QuizTab onHeaderChange={setShowQuizHeader} />
						</TabsContent>
						<TabsContent
							value="exam"
							className="mt-6 grow flex flex-col w-full items-center justify-center animate-fade-in-up"
						>
							<ExamTab />
						</TabsContent>
						<TabsContent
							value="focus"
							className="mt-10 grow flex w-full items-center justify-center animate-fade-in-up"
						>
							<FocusTab />
						</TabsContent>
						<TabsContent
							value="stats"
							className="mt-10 grow flex w-full items-center justify-center animate-fade-in-up"
						>
							<StatsTab />
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
