"use client";

import ArrowDown01FreeIcons from "@hugeicons/core-free-icons/ArrowDown01Icon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import type { Variants } from "framer-motion";
import { m } from "framer-motion";
import { useState } from "react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { LessonCard } from "@/components/lesson";
import type { LessonCardData } from "@/components/lesson/lesson-card";
import { LessonCardProvider } from "@/components/lesson/lesson-card-context";
import { Anim } from "@/components/shared/anim";
import {
	Empty,
	EmptyDescription,
	EmptyTitle,
} from "@/components/shared/empty-state";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useFilteredSubjects } from "@/hooks/use-subjects";

const containerVariants: Variants = {
	hidden: { opacity: 0 },
	show: { opacity: 1 },
};

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	show: { opacity: 1, y: 0 },
};

function LessonSheet() {
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
			<SheetTrigger className="inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border/80 bg-secondary/80 px-5 font-medium text-sm transition-colors hover:border-accent hover:bg-accent">
				<HugeiconsIcon
					icon={Search01Icon}
					className="size-4 text-[--system-accent]"
				/>
				<span>Lessons</span>
			</SheetTrigger>
			<Anim>
				<SheetContent
					className="h-dvh w-full rounded-t-none px-4 sm:max-w-135"
					side="bottom"
				>
					<SheetHeader className="text-left">
						<SheetTitle>Lessons</SheetTitle>
						<SheetDescription>
							Explore lessons across all subjects
						</SheetDescription>
					</SheetHeader>

					<div className="flex grow items-center gap-2 px-4 pb-6">
						<div className="relative">
							<HugeiconsIcon
								icon={Search01Icon}
								className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
							/>
							<Input
								placeholder="Filter by title…"
								aria-label="Filter by title"
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
								className="flex h-8 items-center gap-3"
							>
								{selectedSubject ? selectedSubject : "All subjects"}
								<HugeiconsIcon icon={ArrowDown01FreeIcons} data-icon />
							</Button>
						</SubjectsDrawer>
					</div>

					<div className="flex max-h-[calc(100dvh-var(--spacing-safe-pt)-var(--spacing-safe-pb))] grow flex-col gap-4 overflow-y-auto px-4 pb-4">
						{isLoading && (
							<div className="flex flex-col gap-2">
								{(() => {
									const items = [];
									for (let count = 0; count < 5; count++) {
										items.push(
											<Skeleton
												key={`sk-${count}`}
												className="h-20 rounded-xl"
											/>,
										);
									}
									return items;
								})()}
							</div>
						)}

						{error && (
							<div
								className="py-8 text-center text-destructive text-sm"
								role="alert"
							>
								Failed to load lessons.
							</div>
						)}

						{!isLoading && !error && data?.lessons?.length === 0 && (
							<Empty className="border-none py-8">
								<EmptyTitle>No lessons found</EmptyTitle>
								<EmptyDescription>
									Try selecting a different subject
								</EmptyDescription>
							</Empty>
						)}

						{!isLoading && data?.lessons && data.lessons.length > 0 && (
							<LessonCardProvider>
								<m.div
									variants={containerVariants}
									initial="hidden"
									animate="show"
									className="flex flex-col gap-4"
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

					<SheetClose className="w-full rounded-lg py-4 text-center font-medium text-foreground text-sm transition-colors hover:bg-accent/50">
						Close
					</SheetClose>
				</SheetContent>
			</Anim>
		</Sheet>
	);
}

export const LessonsButton = () => <LessonSheet />;
