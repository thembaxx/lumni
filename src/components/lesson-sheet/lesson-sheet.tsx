"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LessonCard } from "@/components/lesson-card";
import type { LessonCardData } from "@/components/lesson-card/lesson-card";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
	SheetTrigger,
} from "@/components/ui/sheet";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { useFilteredSubjects } from "@/lib/hooks/use-subjects";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowDown01FreeIcons } from "@hugeicons/core-free-icons";

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
			<SheetContent
				className="sm:max-w-135 w-full max-h-[95dvh] px-6"
				side="bottom"
			>
				<SheetHeader className="text-left">
					<SheetTitle>Lessons</SheetTitle>
					<SheetDescription>
						Explore lessons across all subjects
					</SheetDescription>
				</SheetHeader>

				<div className="flex items-center gap-2 px-4 pb-6 grow">
					{/* Search Input */}
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
							<HugeiconsIcon icon={ArrowDown01FreeIcons} className="h-5 w-5" />
						</Button>
					</SubjectsDrawer>
				</div>

				{/* Lessons List */}
				<div className="px-4 pb-4 grow max-h-[95dvh] overflow-y-auto space-y-4">
					{isLoading && (
						<div className="animate-pulse space-y-2">
							{[...Array(5)].map((_, i) => (
								<div key={i} className="h-20 bg-muted rounded-xl" />
							))}
						</div>
					)}

					{error && (
						<div className="text-center text-destructive py-8 text-sm">
							Failed to load lessons.
						</div>
					)}

					{!isLoading && !error && data?.lessons?.length === 0 && (
						<div className="text-center text-muted-foreground py-8 text-sm">
							No lessons found.
						</div>
					)}

					{!isLoading &&
						data?.lessons?.map((lesson: LessonCardData) => (
							<LessonCard key={lesson.id} {...lesson} />
						))}
				</div>

				<SheetClose asChild>
					<Button variant="ghost" className="w-full">
						Close
					</Button>
				</SheetClose>
			</SheetContent>
		</Sheet>
	);
}

export const LessonsButton = () => <LessonSheet />;

export default LessonSheet;
