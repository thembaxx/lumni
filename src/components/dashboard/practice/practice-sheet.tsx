"use client";

import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FocusTab } from "../focus/focus-tab";

interface PracticeSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function PracticeSheet({ open, onOpenChange }: PracticeSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetTrigger asChild>
				<Button
					variant="secondary"
					size="icon"
					className="rounded-xl h-10 w-10"
				>
					<Bookmark className="w-5 h-5 text-muted-foreground" />
				</Button>
			</SheetTrigger>
			<SheetContent className="min-h-[95dvh] flex flex-col max-h-[95dvh] mx-auto mt-0 rounded-t-4xl animate-fade-in-scale">
				<SheetHeader className="flex flex-col items-center">
					<SheetTitle>Practice</SheetTitle>
					<SheetDescription className="max-w-70 text-center text-pretty">
						Practice makes progress. Sharpen your skills with real-world
						scenarios and improve your performance over time.
					</SheetDescription>
				</SheetHeader>
				<div className="px-4 py-2 grow flex flex-col items-center overflow-y-auto">
					<Tabs
						defaultValue="quiz"
						className="flex flex-col items-center gow h-full"
					>
						<TabsList className="h-11">
							<TabsTrigger value="quiz" className="px-4">
								Quiz
							</TabsTrigger>
							<TabsTrigger value="exam" className="px-4">
								Exam
							</TabsTrigger>
							<TabsTrigger value="focus" className="px-4">
								Focus
							</TabsTrigger>
						</TabsList>
						<TabsContent
							value="focus"
							className="mt-12 grow flex items-center justify-center"
						>
							<FocusTab />
						</TabsContent>
					</Tabs>
				</div>
			</SheetContent>
		</Sheet>
	);
}
