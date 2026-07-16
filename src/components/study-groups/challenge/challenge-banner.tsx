"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import type { GroupChallenge, GroupChallengeEntry } from "@/lib/study-groups/challenge-types";

interface Props {
  challenge: GroupChallenge;
  entries: GroupChallengeEntry[];
  subjectId?: string;
  groupId?: string;
}

export function ChallengeBanner({ challenge, entries, subjectId, groupId }: Props) {
  const { push } = useRouter();
  const [now] = useState(() => Date.now());
  const weekEnd = new Date(challenge.weekEnd).getTime();
  const daysLeft = Math.max(0, Math.ceil((weekEnd - now) / (1000 * 60 * 60 * 24)));
  const totalScore = entries.reduce((s, e) => s + e.combinedScore, 0);
  const memberCount = entries.length;

  const weekLabel = (() => {
    const start = new Date(challenge.weekStart);
    const end = new Date(challenge.weekEnd);
    return `${start.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-ZA", { month: "short", day: "numeric" })}`;
  })();

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-(--system-accent)/20 bg-(--system-accent)/5 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={Award01Icon} className="size-6 text-warning" />
          <div>
            <p className="font-semibold text-sm">Weekly Challenge</p>
            <p className="text-muted-foreground text-xs">{weekLabel}</p>
          </div>
        </div>
        <span className="font-mono text-muted-foreground text-xs">
          <span className="tabular-nums">
            {daysLeft > 0 ? `${daysLeft}d remaining` : "Final day"}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-muted-foreground text-xs">
            <span>Group score</span>
            <span className="tabular-nums">{Math.round(totalScore)} pts</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--system-accent) transition-[width]"
              style={{ width: `${Math.min(totalScore, 100)}%` }}
            />
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-lg tabular-nums">{memberCount}</p>
          <p className="ios-caption-3 text-muted-foreground leading-tight">members</p>
        </div>
      </div>
      {subjectId && groupId && (
        <Button
          className="mt-3 w-full"
          size="sm"
          onClick={() =>
            push(
              `/quiz?subject=${encodeURIComponent(subjectId)}&count=10&challenge=true&challengeGroup=${groupId}`,
            )
          }
        >
          Start Challenge Quiz
        </Button>
      )}
    </div>
  );
}
