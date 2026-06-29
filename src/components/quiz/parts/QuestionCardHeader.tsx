import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
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
  visualDescription?: string;
}

export function QuestionCardHeader({
  question,
  effectiveSubject,
  bookmarked,
  onBookmarkToggle,
  isMathSubject,
  onToolClick,
  visualDescription,
}: QuestionCardHeaderProps) {
  const t = useTranslations();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <Badge variant="secondary" className="text-xs font-medium">
            {question.topic}
          </Badge>
          <DifficultyBadge
            difficulty={question.difficulty}
            variant="quiz"
            className="border text-xs"
          />
          <Badge variant="outline" className="text-xs">
            {question.type}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {t("quiz.pointsCount", { points: question.points })}
          </Badge>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {isMathSubject && onToolClick && (
            <button
              type="button"
              onClick={onToolClick}
              className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
              aria-label={t("quiz.snapPhoto")}
            >
              <HugeiconsIcon icon={Camera01Icon} className="size-4 text-muted-foreground" />
            </button>
          )}
          <button
            type="button"
            onClick={onBookmarkToggle}
            className="flex size-9 items-center justify-center rounded-full transition-colors hover:bg-muted"
            aria-label={bookmarked ? t("quiz.removeBookmark") : t("quiz.bookmarkQuestion")}
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
          <TTSButton text={question.questionText} visualDescription={visualDescription} />
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
