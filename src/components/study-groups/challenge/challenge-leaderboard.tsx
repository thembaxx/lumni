"use client";

import ChartBarBigIcon from "@hugeicons/core-free-icons/ChartBarBigIcon";
import MedalFirstPlaceIcon from "@hugeicons/core-free-icons/MedalFirstPlaceIcon";
import MedalSecondPlaceIcon from "@hugeicons/core-free-icons/MedalSecondPlaceIcon";
import MedalThirdPlaceIcon from "@hugeicons/core-free-icons/MedalThirdPlaceIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import type { GroupChallengeEntry } from "@/lib/study-groups/challenge-types";

interface Props {
  entries: GroupChallengeEntry[];
  userNames?: Record<string, string>;
}

const MEDAL_ICONS = [MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon];
const DEFAULT_USER_NAMES = {};

export function ChallengeLeaderboard({ entries, userNames = DEFAULT_USER_NAMES }: Props) {
  const sorted = entries.toSorted((a, b) => b.combinedScore - a.combinedScore);

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
        <HugeiconsIcon icon={ChartBarBigIcon} className="size-8 text-muted-foreground/40" />
        <p className="text-sm">No activity yet this week</p>
        <p className="text-xs">Complete quizzes to earn challenge points!</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {sorted.map((entry, i) => (
        <div
          key={entry.userId}
          className="flex items-center gap-3 rounded-lg bg-muted/30 px-3 py-2.5"
        >
          <div className="flex w-8 items-center justify-center">
            {i < 3 ? (
              <HugeiconsIcon icon={MEDAL_ICONS[i]} className="size-5 text-warning" />
            ) : (
              <span className="font-mono text-muted-foreground text-xs">#{i + 1}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-sm">{userNames[entry.userId] || "Student"}</p>
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>{entry.questionsAnswered} Q</span>
              <span>{(entry.accuracy || 0).toFixed(0)}%</span>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-sm">{Math.round(entry.combinedScore)}</p>
            <p className="ios-caption-3 text-muted-foreground">pts</p>
          </div>
        </div>
      ))}
    </div>
  );
}
