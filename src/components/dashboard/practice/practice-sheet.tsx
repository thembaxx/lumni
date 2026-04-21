"use client";

import { IconCloud } from "@tabler/icons-react";
import { Bookmark } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";
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
					<Bookmark className="w-5 h-5 text-muted-foreground" />
				</Button>
			</SheetTrigger>
			<SheetContent className="min-h-[95dvh] flex flex-col max-h-[95dvh] mx-auto mt-0 rounded-t-4xl animate-fade-in-scale">
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
							<TabsTrigger value="lab" className="px-4">
								Lab
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="quiz"
							className="mt-8 grow flex flex-col w-full items-center justify-center"
						>
							<QuizTab onHeaderChange={setShowQuizHeader} />
							{showQuizHeader && (
								<Empty className="border border-dashed mt-24">
									<EmptyHeader>
										<EmptyMedia variant="icon">
											<IconCloud />
										</EmptyMedia>
										<EmptyTitle>Quiz has not started</EmptyTitle>
										<EmptyDescription>
											Practice quizzes you start will be saved here for easy
											access later. You can also view and manage your past quiz
											attempts here.
										</EmptyDescription>
									</EmptyHeader>
									<EmptyContent>
										<Button variant="outline" size="sm">
											Start quiz
										</Button>
									</EmptyContent>
								</Empty>
							)}
						</TabsContent>
						<TabsContent
							value="focus"
							className="mt-12 grow flex w-full items-center justify-center"
						>
							<FocusTab />
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
