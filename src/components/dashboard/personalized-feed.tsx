"use client";

import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import FlashIcon from "@hugeicons/core-free-icons/FlashIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import ClockIcon from "@hugeicons/core-free-icons/Clock01Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { type ReactNode, useState } from "react";
import type { ScoredRecommendation } from "@/lib/recommendation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { StaggerList } from "@/components/shared/stagger-list";

const ICONS: Record<string, ReactNode> = {
  "exam-practice": <HugeiconsIcon icon={Target01Icon} size={16} />,
  "weakest-topic": <HugeiconsIcon icon={BrainIcon} size={16} />,
  "due-cards": <HugeiconsIcon icon={FlashIcon} size={16} />,
  "review-mistakes": <HugeiconsIcon icon={ClockIcon} size={16} />,
};

function FeedCard({
  rec,
  rank,
  onDismiss,
}: {
  rec: ScoredRecommendation;
  rank: number;
  onDismiss: (kind: string) => void;
}) {
  const isFirst = rank === 1;

  return (
    <Card
      className={
        isFirst
          ? "relative border-system-accent/20 bg-system-accent/5"
          : "relative border-border/40"
      }
    >
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => onDismiss(rec.kind)}
        className="absolute top-2 right-2 text-muted-foreground/30 hover:text-foreground"
        aria-label="Dismiss"
      >
        <HugeiconsIcon icon={Cancel01Icon} data-icon />
      </Button>
      <CardContent className="flex items-start gap-3 px-4 py-3">
        <span
          className={
            isFirst
              ? "mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-system-accent font-bold text-system-accent-foreground tabular-nums text-xs"
              : "mt-1 flex size-6 shrink-0 items-center justify-center rounded-md bg-muted font-medium text-muted-foreground tabular-nums text-xs"
          }
        >
          {rank}
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="shrink-0 text-muted-foreground">{ICONS[rec.kind]}</span>
            <span
              className={
                isFirst ? "truncate font-semibold text-sm" : "truncate font-medium text-sm"
              }
            >
              {rec.title}
            </span>
          </div>
          <p className="line-clamp-2 text-muted-foreground text-xs leading-relaxed">{rec.reason}</p>
          <Link
            href={rec.ctaHref}
            prefetch={true}
            className={
              isFirst
                ? "mt-0.5 inline-flex min-h-9 w-fit items-center rounded-lg bg-system-accent px-3.5 font-medium text-system-accent-foreground text-xs transition-[background-color,transform] hover:bg-system-accent/85 press-scale"
                : "mt-0.5 inline-flex min-h-9 w-fit items-center rounded-lg bg-secondary px-3 font-medium text-secondary-foreground text-xs transition-[background-color,transform] hover:bg-secondary/80 press-scale"
            }
          >
            {rec.ctaLabel}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export function PersonalizedFeed({ recommendations }: { recommendations: ScoredRecommendation[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!recommendations.length) return null;

  const visible = recommendations.filter((r) => !dismissed.has(r.kind));
  if (!visible.length) return null;

  const handleDismiss = (kind: string) => {
    setDismissed((prev) => new Set(prev).add(kind));
  };

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted-foreground/70 text-xs font-medium uppercase tracking-wider">
        Recommended
      </h3>
      <StaggerList>
        {visible.map((rec, i) => (
          <FeedCard key={`${rec.kind}-${i}`} rec={rec} rank={i + 1} onDismiss={handleDismiss} />
        ))}
      </StaggerList>
    </div>
  );
}
