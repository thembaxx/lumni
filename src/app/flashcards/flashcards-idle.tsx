"use client";

import {
	ArrowDown01Icon,
	BulbIcon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
	onReviewMistakes: (subject: string) => void;
}

export function FlashcardsIdle({
	onSelect,
	onReviewMistakes,
}: FlashcardsIdleProps) {
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
									<HugeiconsIcon icon={BulbIcon} className="size-8" />
								</EmptyMedia>
								<EmptyTitle>Ready to start studying?</EmptyTitle>
								<EmptyDescription>
									Generate new flashcards or review your past mistakes.
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<div className="flex flex-col gap-3">
									<SubjectsDrawer onSelect={onSelect}>
										<Button>
											Generate AI Flashcards
											<HugeiconsIcon icon={BulbIcon} className="w-4 h-4 ml-1" />
										</Button>
									</SubjectsDrawer>
									<SubjectsDrawer onSelect={onReviewMistakes}>
										<Button variant="outline">
											Review Mistakes
											<HugeiconsIcon
												icon={RefreshIcon}
												className="w-4 h-4 ml-1"
											/>
										</Button>
									</SubjectsDrawer>
								</div>
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
