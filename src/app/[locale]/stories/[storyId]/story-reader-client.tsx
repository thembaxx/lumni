"use client";

import {
	ArrowLeft01Icon,
	BookOpen01Icon,
	Lightning,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { cacheStory, generateComprehensionQuestions } from "@/lib/stories";
import { loadStoryContent } from "@/lib/stories/story-data";
import type { Story } from "@/lib/stories/types";

export function StoryReaderClient() {
	const { storyId } = useParams<{ storyId: string }>();
	const { back } = useRouter();
	const [story, setStory] = useState<Story | null>(null);
	const [loading, setLoading] = useState(true);
	const [questions, setQuestions] = useState<any[] | null>(null);
	const [questionsLoading, setQuestionsLoading] = useState(false);
	const [showQuestions, setShowQuestions] = useState(false);

	useEffect(() => {
		if (!storyId) return;
		loadStoryContent(storyId).then((s) => {
			setStory(s);
			setLoading(false);
			if (s) {
				cacheStory(storyId, s).catch(() => {});
			}
		});
	}, [storyId]);

	const handleLoadQuestions = useCallback(async () => {
		if (!story) return;
		setQuestionsLoading(true);
		try {
			const qs = await generateComprehensionQuestions(story);
			setQuestions(qs);
			setShowQuestions(true);
		} finally {
			setQuestionsLoading(false);
		}
	}, [story]);

	if (loading) {
		return (
			<PageContainer className="gap-4 pt-8">
				<Skeleton className="h-8 w-64 rounded-2xl" />
				<Skeleton className="h-4 w-40 rounded-2xl" />
				<Skeleton className="mt-4 h-96 w-full rounded-3xl" />
			</PageContainer>
		);
	}

	if (!story) {
		return (
			<PageContainer className="flex flex-col items-center gap-3 py-16 text-center">
				<HugeiconsIcon
					icon={BookOpen01Icon}
					className="size-12 text-muted-foreground/30"
				/>
				<p className="font-semibold text-lg">Story not found</p>
				<p className="text-muted-foreground text-sm">
					This story might have been removed or is not available yet.
				</p>
				<Button
					variant="outline"
					onClick={() => back()}
					className="mt-2 rounded-full"
				>
					Go back
				</Button>
			</PageContainer>
		);
	}

	return (
		<PageContainer className="gap-6 pt-8">
			<Button
				variant="ghost"
				size="sm"
				onClick={() => back()}
				className="self-start rounded-full"
				aria-label="Go back to stories"
			>
				<HugeiconsIcon icon={ArrowLeft01Icon} className="size-4" />
				Back
			</Button>

			<m.div
				initial={{ opacity: 0, y: 16 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
			>
				<Card className="overflow-hidden rounded-3xl shadow-level-1">
					<CardHeader>
						<div className="flex flex-wrap items-center gap-2">
							<Badge variant="secondary" className="rounded-full text-xs">
								{story.language}
							</Badge>
							{story.gradeLevel && (
								<Badge variant="outline" className="rounded-full text-xs">
									Grade {story.gradeLevel}
								</Badge>
							)}
							<span className="text-muted-foreground text-xs">
								{story.wordCount.toLocaleString()} words
							</span>
							{story.readTimeMinutes && (
								<span className="text-muted-foreground text-xs">
									{story.readTimeMinutes} min read
								</span>
							)}
							{story.license && (
								<Badge
									variant="outline"
									className="rounded-full text-[10px] uppercase tracking-wide"
								>
									{story.license === "public-domain"
										? "Public Domain"
										: story.license}
								</Badge>
							)}
						</div>
						<CardTitle className="mt-3 font-extrabold text-2xl tracking-tight">
							{story.title}
						</CardTitle>
						<p className="text-muted-foreground text-sm">by {story.author}</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-6 p-5 pt-0">
						<div className="text-base/7 leading-[1.75]">
							<MarkdownRenderer content={story.content} />
						</div>
					</CardContent>
				</Card>
			</m.div>

			<div className="flex flex-col gap-3">
				{!showQuestions ? (
					<Button
						variant="default"
						size="lg"
						onClick={handleLoadQuestions}
						disabled={questionsLoading}
						className="self-start rounded-full"
					>
						<HugeiconsIcon icon={Lightning} className="size-5" />
						{questionsLoading
							? "Generating questions..."
							: "Practice Comprehension"}
					</Button>
				) : (
					<m.div
						initial={{ opacity: 0, y: 16 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{
							duration: 0.4,
							ease: [0.32, 0.72, 0, 1],
						}}
					>
						<Card className="overflow-hidden rounded-3xl shadow-level-1">
							<CardHeader>
								<CardTitle className="font-extrabold text-lg">
									Comprehension Questions
								</CardTitle>
							</CardHeader>
							<CardContent className="flex flex-col gap-4 p-5 pt-0">
								{questions && questions.length > 0 ? (
									questions.map((q, i) => (
										<div
											key={q.id ?? i}
											className="rounded-2xl border bg-card p-4"
										>
											<p className="mb-2 font-medium text-sm">
												{i + 1}. {q.questionText ?? q.question}
											</p>
										</div>
									))
								) : (
									<p className="text-muted-foreground text-sm">
										No questions could be generated for this story.
									</p>
								)}
							</CardContent>
						</Card>
					</m.div>
				)}
			</div>
		</PageContainer>
	);
}
