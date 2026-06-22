"use client";

import Book02Icon from "@hugeicons/core-free-icons/Book02Icon";
import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { SubjectsDrawer } from "@/components/dashboard/drawers/subjects-drawer";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";

interface FlashcardsIdleProps {
	onSelect: (subject: string) => void;
	onReviewMistakes: (subject: string) => void;
	onReviewVocabulary: (subject: string) => void;
}

export function FlashcardsIdle({
	onSelect,
	onReviewMistakes,
	onReviewVocabulary,
}: FlashcardsIdleProps) {
	const t = useTranslations();
	return (
		<div className="grid min-h-dvh grid-cols-12 gap-0 bg-background">
			<div className="col-span-12 col-start-1 flex items-center justify-center p-4 pb-20 md:col-span-7">
				<div className="card-elevated mx-auto w-full max-w-md overflow-hidden rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2">
					<header className="pb-4 text-left">
						<h2 className="font-semibold text-2xl tracking-tight">
							{t("flashcards.title")}
						</h2>
					</header>
					<div className="flex flex-col gap-4">
						<Empty>
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<HugeiconsIcon icon={BulbIcon} className="size-8" />
								</EmptyMedia>
								<EmptyTitle>{t("flashcards.readyToStart")}</EmptyTitle>
								<EmptyDescription>
									{t("flashcards.generateOrReview")}
								</EmptyDescription>
							</EmptyHeader>
							<EmptyContent>
								<div className="flex flex-col gap-3">
									<SubjectsDrawer onSelect={onSelect}>
										<Button>
											{t("flashcards.generateAiFlashcards")}
											<HugeiconsIcon icon={BulbIcon} className="ml-1 size-4" />
										</Button>
									</SubjectsDrawer>
									<SubjectsDrawer onSelect={onReviewMistakes}>
										<Button variant="outline">
											{t("flashcards.reviewMistakes")}
											<HugeiconsIcon
												icon={RefreshIcon}
												className="ml-1 size-4"
											/>
										</Button>
									</SubjectsDrawer>
									<SubjectsDrawer onSelect={onReviewVocabulary}>
										<Button variant="outline">
											{t("flashcards.reviewVocabulary")}
											<HugeiconsIcon
												icon={Book02Icon}
												className="ml-1 size-4"
											/>
										</Button>
									</SubjectsDrawer>
								</div>
							</EmptyContent>
						</Empty>
					</div>
				</div>
			</div>
			<div className="relative col-span-12 col-start-1 overflow-hidden bg-system-surface/30 md:col-span-5 md:col-start-8">
				<div className="absolute inset-0 bg-gradient-to-br from-[--system-accent]/10 via-transparent to-transparent" />
				<div className="absolute inset-0 flex items-center justify-center p-8">
					<div className="aspect-square h-full w-full max-w-xs animate-float-slow rounded-3xl bg-[--system-accent]/10 blur-2xl" />
				</div>
			</div>
		</div>
	);
}
