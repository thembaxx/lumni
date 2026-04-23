"use client";

import { ArrowDown01FreeIcons } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import type { Variants } from "framer-motion";
import { AnimatePresence, domAnimation, LazyMotion, m } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { LessonCard } from "@/components/lesson";
import type { LessonCardData } from "@/components/lesson/lesson-card";
import { LessonCardProvider } from "@/components/lesson/lesson-card-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { useFilteredSubjects } from "@/lib/hooks/use-subjects";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: { opacity: 1 },
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

export function LessonSheet() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
	const [searchQuery, setSearchQuery] = useState("");

	useFilteredSubjects("");

	const { data, isLoading, error } = useQuery({
		queryKey: ["lessons", selectedSubject, searchQuery],
		queryFn: async () => {
			const params = new URLSearchParams();
			if (selectedSubject) params.set("subject", selectedSubject);
			if (searchQuery) params.set("search", searchQuery);
			const res = await fetch(`/api/lessons?${params}`);
			if (!res.ok) throw new Error("Failed to fetch lessons");
			const json = await res.json();
			return { lessons: json.lessons };
		},
	});

	return (
		<Sheet open={isOpen} onOpenChange={setIsOpen}>
			<SheetTrigger asChild>
				<Button variant="outline" className="gap-2">
					<Search className="h-4 w-4" />
					Lessons
				</Button>
			</SheetTrigger>
			<LazyMotion features={domAnimation}>
				<SheetContent
					className="sm:max-w-135 w-full h-dvh px-4 rounded-t-none"
					side="bottom"
				>
					<SheetHeader className="text-left">
						<SheetTitle>Lessons</SheetTitle>
						<SheetDescription>
							Explore lessons across all subjects
						</SheetDescription>
					</SheetHeader>

					<div className="flex items-center gap-2 px-4 pb-6 grow">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
							<Input
								placeholder="Filter by title..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-10"
							/>
						</div>
						<SubjectsDrawer
							onSelect={(subject) => {
								setSelectedSubject(subject);
							}}
						>
							<Button
								variant="outline"
								size="sm"
								className="flex items-center gap-3 h-8"
							>
								{selectedSubject ? selectedSubject : "All subjects"}
								<HugeiconsIcon
									icon={ArrowDown01FreeIcons}
									className="h-5 w-5"
								/>
							</Button>
						</SubjectsDrawer>
					</div>

					<div className="px-4 pb-4 grow max-h-[95dvh] overflow-y-auto space-y-4">
						{isLoading && (
							<div className="animate-pulse space-y-2">
								{[...Array(5)].map((_, i) => (
									<div key={i} className="h-20 bg-muted rounded-xl" />
								))}
							</div>
						)}

						{error && (
							<div
								className="text-center text-destructive py-8 text-sm"
								role="alert"
							>
								Failed to load lessons.
							</div>
						)}

						{!isLoading && !error && data?.lessons?.length === 0 && (
							<div className="text-center text-muted-foreground py-8 text-sm">
								No lessons found.
							</div>
						)}

						{!isLoading && data?.lessons && data.lessons.length > 0 && (
							<LessonCardProvider>
								<m.div
									variants={containerVariants}
									initial="hidden"
									animate="show"
									className="space-y-4"
								>
									{data.lessons.map((lesson: LessonCardData) => (
										<m.div key={lesson.id} variants={itemVariants}>
											<LessonCard {...lesson} />
										</m.div>
									))}
								</m.div>
							</LessonCardProvider>
						)}
					</div>

					<SheetClose className="py-4" asChild>
						<Button variant="ghost" className="w-full">
							Close
						</Button>
					</SheetClose>
				</SheetContent>
			</LazyMotion>
		</Sheet>
	);
}

export const LessonsButton = () => <LessonSheet />;

export default LessonSheet;
