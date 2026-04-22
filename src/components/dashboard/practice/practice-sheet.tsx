"use client";

import { More01Icon } from "@hugeicons/core-free-icons";
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
			<SheetTrigger asChild>
				<Button
					variant="secondary"
					size="icon"
					className="rounded-xl h-10 w-10"
					aria-label="Open practice sheet"
				>
					<HugeiconsIcon
						icon={More01Icon}
						className="w-4 h-4 transition-transform duration-200"
					/>
				</Button>
			</SheetTrigger>
			<SheetContent
				side="bottom"
				className="min-h-[95dvh] flex flex-col max-h-[95dvh] mx-auto mt-0 rounded-t-4xl animate-fade-in-scale"
			>
				<SheetHeader
					className={`flex flex-col items-center transition-opacity duration-300 ${
						showQuizHeader
							? "opacity-100"
							: "opacity-0 pointer-events-none absolute"
					}`}
				>
					<SheetTitle>Practice</SheetTitle>
				</SheetHeader>
				<div
					className={`px-4 py-2 w-full grow flex flex-col items-center overflow-y-auto`}
				>
					<Tabs
						defaultValue="quiz"
						className="flex flex-col items-center w-full h-full"
					>
						<TabsList
							className={`h-11 transition-opacity duration-300 ${
								showQuizHeader
									? "opacity-100"
									: "opacity-0 pointer-events-none absolute"
							}`}
						>
							<TabsTrigger value="quiz" className="px-4">
								Quiz
							</TabsTrigger>
							<TabsTrigger value="exam" className="px-4">
								Exam
							</TabsTrigger>
							<TabsTrigger value="focus" className="px-4">
								Focus
							</TabsTrigger>
							<TabsTrigger value="stats" className="px-4">
								Stats
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="quiz"
							className="mt-8 grow flex flex-col w-full items-center justify-center"
						>
							<QuizTab onHeaderChange={setShowQuizHeader} />
						</TabsContent>
						<TabsContent
							value="focus"
							className="mt-12 grow flex w-full items-center justify-center animate-fade-in-up"
						>
							<FocusTab />
						</TabsContent>
						<TabsContent
							value="stats"
							className="mt-12 grow flex w-full items-center justify-center"
						>
							<StatsTab />
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
