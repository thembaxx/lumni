"use client";

import { ArrowDown, Lightbulb } from "@phosphor-icons/react";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import { Button } from "@/components/ui/button";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

interface FlashcardsIdleProps {
	onSelect: (subject: string) => void;
}

export function FlashcardsIdle({ onSelect }: FlashcardsIdleProps) {
	return (
		<div className="min-h-[100dvh] bg-background grid grid-cols-12 gap-0">
			<div className="col-span-12 md:col-span-7 col-start-1 flex items-center justify-center p-4 pb-20">
				<div className="max-w-md w-full mx-auto card-elevated overflow-hidden rounded-[2.5rem] border border-border/80 bg-card shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] p-6">
					<header className="text-left pb-4">
						<h2 className="text-2xl font-extrabold tracking-tight">
							Flashcards
						</h2>
					</header>
					<div className="space-y-4">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<Lightbulb className="size-8" />
								</EmptyMedia>
								<EmptyTitle>Start Learning</EmptyTitle>
								<EmptyDescription>
									Select a subject to study with flashcards
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<SubjectsDrawer onSelect={onSelect}>
									<Button>
										Choose Subject
										<ArrowDown className="w-4 h-4 ml-1" />
									</Button>
								</SubjectsDrawer>
							</EmptyContent>
						</Empty>
					</div>
				</div>
			</div>
			<div className="col-span-12 md:col-span-5 col-start-1 md:col-start-8 relative overflow-hidden bg-system-surface/30">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="w-full h-full max-w-xs aspect-square rounded-3xl bg-[--system-accent]/10 blur-2xl animate-float-slow" />
				</div>
			</div>
		</div>
	);
}
