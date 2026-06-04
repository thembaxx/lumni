import { Camera01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { TTSButton } from "@/components/shared/tts-button";
import { Badge } from "@/components/ui/badge";

const TopicGraph = dynamic(
	() => import("@/components/quiz/topic-graph").then((m) => m.TopicGraph),
	{ ssr: false },
);

interface QuestionCardHeaderProps {
	question: {
		id: string;
		questionText: string;
		topic: string;
		type: string;
		points: number;
		subject: string;
		difficulty: string;
	};
	effectiveSubject: string;
	bookmarked: boolean;
	onBookmarkToggle: () => void;
	isMathSubject: boolean;
	onToolClick: () => void;
}

export function QuestionCardHeader({
	question,
	effectiveSubject,
	bookmarked,
	onBookmarkToggle,
	isMathSubject,
	onToolClick,
}: QuestionCardHeaderProps) {
	const t = useTranslations();
	return (
		<div className="gap-4">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					<Badge
						variant="outline"
						className="bg-[--system-accent]/10 font-medium"
					>
						<span className="opacity-80">{question.topic}</span>
					</Badge>
					<DifficultyBadge
						difficulty={question.difficulty}
						variant="quiz"
						className="border font-mono text-xs"
					/>
					<Badge
						variant="outline"
						className="bg-[--system-accent]/5 font-mono text-xs"
					>
						{question.type}
					</Badge>
				</div>
				<div className="flex items-center gap-1">
					{isMathSubject && onToolClick && (
						<button
							type="button"
							onClick={onToolClick}
							className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
							aria-label={t("quiz.snapPhoto")}
						>
							<HugeiconsIcon
								icon={Camera01Icon}
								className="size-4 text-muted-foreground"
							/>
						</button>
					)}
					<button
						type="button"
						onClick={onBookmarkToggle}
						className="flex size-8 items-center justify-center rounded-full transition-colors hover:bg-muted"
						aria-label={
							bookmarked ? t("quiz.removeBookmark") : t("quiz.bookmarkQuestion")
						}
					>
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill={bookmarked ? "currentColor" : "none"}
							stroke="currentColor"
							strokeWidth="2"
							className={bookmarked ? "text-warning" : "text-muted-foreground"}
						>
							<title>{t("quiz.bookmark")}</title>
							<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
						</svg>
					</button>
					<TTSButton text={question.questionText} />
					<Badge variant="secondary" className="text-xs">
						{t("quiz.pointsCount", { points: question.points })}
					</Badge>
				</div>
			</div>
			<MarkdownRenderer
				content={question.questionText}
				subject={effectiveSubject}
				className="text-lg leading-relaxed"
			/>
			<TopicGraph subject={question.subject} topic={question.topic} />
		</div>
	);
}
