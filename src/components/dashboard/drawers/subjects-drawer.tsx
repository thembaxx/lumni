"use client";

import { Search } from "lucide-react";
import { useRef, useState } from "react";
import {
	Drawer,
	DrawerClose,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
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
	userId,
	selectedSubjects = EMPTY_SELECTION,
	onSelectionChange,
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
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent className="mx-auto max-w-lg mt-0 rounded-b-2xl min-h-[60dvh] animate-fade-in-scale">
				<DrawerClose ref={drawerCloseRef} className="hidden" />
				<DrawerHeader className="text-left">
					<DrawerTitle className="text-left">Select Subject</DrawerTitle>
					<DrawerDescription className="text-left">
						Choose a Grade 12 NSC subject for your studies.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 pb-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
						<Input
							type="text"
							placeholder="Search subjects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="h-10 pl-10 pr-4 rounded-lg"
						/>
					</div>
				</div>

				<div className="px-4 pb-4 pt-0 grow max-h-[50dvh] overflow-y-auto">
					{isLoading ? (
						<p className="text-center text-muted-foreground py-8 text-sm">
							Loading subjects...
						</p>
					) : error ? (
						<p className="text-center text-destructive py-8 text-sm">
							Failed to load subjects.
							{error instanceof Error && error.message.includes("readonly") && (
								<span className="block mt-2 text-xs">
									Database is read-only. Please contact support.
								</span>
							)}
						</p>
					) : subjects?.length === 0 ? (
						<p className="text-center text-muted-foreground py-8 text-sm">
							No subjects found.
						</p>
					) : (
						<div className="space-y-1">
							{subjects?.map((subject) => (
								<Button
									key={subject.id + subject.name}
									variant="ghost"
									className="w-full justify-start h-auto p-3 rounded-lg hover:bg-secondary"
									onClick={() => handleSelect(subject.name)}
								>
									<div className="text-left">
										<p className="font-medium text-foreground">{subject.name}</p>
										<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
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

export const SubjectDrawer = SubjectsDrawer;
