"use client";

import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { useFilteredSubjects } from "@/hooks/use-subjects";

const EMPTY_SELECTION: string[] = [];

type SubjectsDrawerProps = {
	children?: React.ReactNode;
	onSelect?: (subject: string) => void;
	userId?: string;
	selectedSubjects?: string[];
	onSelectionChange?: (newSelection: string[]) => void;
};

export function SubjectsDrawer({
	children,
	onSelect,
	userId: _userId,
	selectedSubjects: _selectedSubjects = EMPTY_SELECTION,
	onSelectionChange: _onSelectionChange,
}: SubjectsDrawerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: subjects, isLoading, error } = useFilteredSubjects(searchQuery);
	const drawerCloseRef = useRef<HTMLButtonElement>(null);

	const handleSelect = (subjectName: string) => {
		onSelect?.(subjectName);
		drawerCloseRef.current?.click();
	};

	return (
		<Drawer direction="bottom">
			<DrawerTrigger
				asChild
				className="inline-flex items-center justify-center"
			>
				{children}
			</DrawerTrigger>
			<DrawerContent className="mx-auto mt-0 min-h-[60dvh] max-w-lg animate-fade-in-scale rounded-b-2xl">
				<DrawerClose ref={drawerCloseRef} className="hidden" />
				<DrawerHeader className="text-left">
					<DrawerTitle className="text-left">Select Subject</DrawerTitle>
					<DrawerDescription className="text-left">
						Choose a Grade 12 NSC subject for your studies.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 pb-2">
					<div className="relative">
						<HugeiconsIcon
							icon={Search01Icon}
							className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
						/>
						<Input
							type="text"
							placeholder="Search subjects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 rounded-lg pr-4 pl-10"
						/>
					</div>
				</div>

				<div className="max-h-[50dvh] grow overflow-y-auto px-4 pt-0 pb-4">
					{isLoading ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							Loading subjects...
						</p>
					) : error ? (
						<p className="py-8 text-center text-destructive text-sm">
							Failed to load subjects.
							{error instanceof Error && error.message.includes("readonly") && (
								<span className="mt-2 block text-xs">
									DatabaseIcon is read-only. Please contact support.
								</span>
							)}
						</p>
					) : subjects?.length === 0 ? (
						<p className="py-8 text-center text-muted-foreground text-sm">
							No subjects found.
						</p>
					) : (
						<div className="flex flex-col gap-1">
							{subjects?.map((subject) => (
								<Button
									key={subject.id + subject.name}
									variant="ghost"
									className="w-full justify-start rounded-lg p-3 hover:bg-secondary"
									onClick={() => handleSelect(subject.name)}
								>
									<div className="flex w-full flex-col overflow-hidden text-left">
										<p className="font-medium text-foreground">
											{subject.name}
										</p>
										<p className="mt-0.5 line-clamp-2 whitespace-pre-line text-pretty text-muted-foreground text-xs">
											{subject.description}
										</p>
									</div>
								</Button>
							))}
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
