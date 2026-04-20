"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import {
	Drawer,
	DrawerContent,
	DrawerDescription,
	DrawerHeader,
	DrawerTitle,
	DrawerTrigger,
} from "@/components/ui/drawer";
import { useFilteredSubjects } from "@/lib/hooks/use-subjects";

type SubjectsDrawerProps = {
	children: React.ReactNode;
};

export function SubjectsDrawer({ children }: SubjectsDrawerProps) {
	const [searchQuery, setSearchQuery] = useState("");
	const { data: subjects, isLoading, error } = useFilteredSubjects(searchQuery);

	return (
		<Drawer direction="bottom">
			<DrawerTrigger asChild>{children}</DrawerTrigger>
			<DrawerContent className="mx-auto max-w-lg mt-0 rounded-b-2xl min-h-[60dvh] animate-fade-in-scale">
				<DrawerHeader className="text-left">
					<DrawerTitle className="text-left">Select Subject</DrawerTitle>
					<DrawerDescription className="text-left">
						Choose a Grade 12 NSC subject for your studies.
					</DrawerDescription>
				</DrawerHeader>

				<div className="px-4 pb-2">
					<div className="relative">
						<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<input
							type="text"
							placeholder="Search subjects..."
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full h-10 pl-10 pr-4 rounded-lg bg-secondary border border-border text-foreground placeholder-muted-foreground text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
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
						</p>
					) : subjects?.length === 0 ? (
						<p className="text-center text-muted-foreground py-8 text-sm">
							No subjects found.
						</p>
					) : (
						<div className="space-y-1">
							{subjects?.map((subject) => (
								<button
									key={subject.id + subject.name}
									className="w-full text-left p-3 rounded-lg hover:bg-secondary transition-colors duration-200"
								>
									<p className="font-medium text-foreground">{subject.name}</p>
									<p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
										{subject.description}
									</p>
								</button>
							))}
						</div>
					)}
				</div>
			</DrawerContent>
		</Drawer>
	);
}
