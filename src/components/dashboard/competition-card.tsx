"use client";

import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import MedalFirstPlaceIcon from "@hugeicons/core-free-icons/MedalFirstPlaceIcon";
import MedalSecondPlaceIcon from "@hugeicons/core-free-icons/MedalSecondPlaceIcon";
import MedalThirdPlaceIcon from "@hugeicons/core-free-icons/MedalThirdPlaceIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { getTimeRemaining } from "@/lib/competitions/service";
import { useGamificationContext } from "@/contexts/gamification-provider";

interface ApiLeaderboardEntry {
  rank: number;
  userId: string;
  label: string;
  xp: number;
  streak: number;
  level: number;
  subject: string | null;
}

const MEDAL_ICONS = [MedalFirstPlaceIcon, MedalSecondPlaceIcon, MedalThirdPlaceIcon];

const SUBJECT_TABS = [
  { id: undefined, label: "All" },
  { id: "mathematics", label: "Math" },
  { id: "physical-sciences", label: "Physics" },
  { id: "life-sciences", label: "Life Sci" },
  { id: "accounting", label: "Accounting" },
  { id: "geography", label: "Geography" },
];

export function CompetitionCard() {
  const { user } = useAuth();
  const userId = user?.$id ?? "";
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ["competition-leaderboard", activeTab],
    queryFn: async (): Promise<ApiLeaderboardEntry[]> => {
      const params = new URLSearchParams();
      if (activeTab) params.set("subject", activeTab);
      const res = await fetch(`/api/leaderboard?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch leaderboard");
      const data = await res.json();
      return data.entries ?? [];
    },
    refetchInterval: 60000,
  });

  const myRank = useMemo(
    () => (userId ? (leaderboard?.find((e) => e.userId === userId) ?? null) : null),
    [leaderboard, userId],
  );

  const { checkAndUnlockAchievements, levelInfo } = useGamificationContext();

  useEffect(() => {
    if (!myRank || !leaderboard) return;
    const rank = myRank.rank;
    const subjectRank = activeTab
      ? (leaderboard.find((e) => e.userId === userId)?.rank ?? 999)
      : undefined;
    checkAndUnlockAchievements(0, 0, 0, levelInfo.level, false, {
      leaderboardRank: rank,
      subjectLeaderboardRank: subjectRank,
    });
  }, [myRank, leaderboard, userId, activeTab, checkAndUnlockAchievements, levelInfo.level]);

  const timeLeft = getTimeRemaining();

  if (isLoading) {
    return (
      <Card className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-10 w-full" />
      </Card>
    );
  }

  const top10 = leaderboard?.slice(0, 10) ?? [];
  const rankText = myRank
    ? `#${myRank.rank}`
    : leaderboard && leaderboard.length > 0
      ? `#${leaderboard.length + 1}`
      : "--";

  return (
    <Link href="/study-groups" prefetch={true}>
      <Card className="group flex flex-col gap-3 p-4 transition-[scale,box-shadow,background-color,transform] duration-300 press-scale">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HugeiconsIcon icon={Award01Icon} className="size-5 text-warning" />
            <h3 className="font-bold text-sm tracking-tight">Weekly Competition</h3>
          </div>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            <span className="tabular-nums">
              {timeLeft.days > 0
                ? `${timeLeft.days}d ${timeLeft.hours}h remaining`
                : `${timeLeft.hours}h remaining`}
            </span>
          </span>
          <span className="font-medium tabular-nums">{rankText}</span>
        </div>

        <div className="flex flex-wrap gap-1">
          {SUBJECT_TABS.map((tab) => (
            <button
              key={tab.id ?? "all"}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(tab.id);
              }}
              aria-pressed={activeTab === tab.id}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-[background-color,color,transform] press-scale ${
                activeTab === tab.id
                  ? "bg-accent text-accent-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {top10.length > 0 && (
          <div className="flex flex-col gap-1">
            {top10.slice(0, 3).map((entry, i) => (
              <div
                key={entry.userId + (i === 0 ? "-first" : "")}
                className={`flex items-center justify-between rounded-lg px-3 py-1.5 text-sm ${
                  entry.userId === userId ? "bg-accent/20 font-medium" : "bg-muted/30"
                }`}
              >
                <div className="flex items-center gap-2">
                  <HugeiconsIcon icon={MEDAL_ICONS[i]} className="size-5 text-warning" />
                  <span className="max-w-28 truncate font-mono text-xs">
                    {entry.label ?? entry.userId.slice(0, 8)}
                  </span>
                </div>
                <span className="font-mono text-xs tabular-nums">{entry.xp} XP</span>
              </div>
            ))}
            {top10.length > 3 && (
              <div className="flex flex-col gap-1 pt-1">
                {top10.slice(3).map((entry) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center justify-between rounded-lg px-3 py-1 text-sm ${
                      entry.userId === userId ? "bg-accent/20 font-medium" : "hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 text-center font-mono text-xs text-muted-foreground">
                        {entry.rank}
                      </span>
                      <span className="max-w-28 truncate text-xs">
                        {entry.label ?? entry.userId.slice(0, 8)}
                      </span>
                    </div>
                    <span className="font-mono text-xs tabular-nums">{entry.xp} XP</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(!leaderboard || leaderboard.length === 0) && (
          <p className="text-muted-foreground text-xs">
            Complete quizzes to earn XP and climb the leaderboard!
          </p>
        )}
      </Card>
    </Link>
  );
}
