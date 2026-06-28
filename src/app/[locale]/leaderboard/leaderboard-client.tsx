"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { PageContainer } from "@/components/layout/page-container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { useLeaderboard } from "@/hooks/use-leaderboard";

const rankColors = [
  "text-amber-400 dark:text-amber-300",
  "text-zinc-400 dark:text-zinc-300",
  "text-orange-700 dark:text-orange-400",
];

export function LeaderboardClient() {
  const { user } = useAuth();
  const { entries, isLoading } = useLeaderboard(user?.$id);

  return (
    <PageContainer>
      <div className="flex flex-col gap-6 py-6">
        <div>
          <h1 className="font-bold text-2xl">Leaderboard</h1>
          <p className="text-muted-foreground/60 text-sm">
            See how your XP and streaks compare to other students
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HugeiconsIcon icon={Award01Icon} className="size-5 text-warning" />
              All-Time Rankings
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">
                No rankings yet. Start studying to appear here!
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {entries.map((entry, i) => (
                  <div
                    key={entry.userId ?? i}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-3 transition-colors",
                      entry.isCurrentUser && "bg-accent",
                    )}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center">
                      {i < 3 ? (
                        <HugeiconsIcon icon={Award01Icon} size={20} className={rankColors[i]} />
                      ) : (
                        <span className="font-mono text-muted-foreground text-xs">{entry.rank}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-sm">{entry.label}</p>
                      {entry.level != null && (
                        <p className="text-muted-foreground text-xs">Level {entry.level}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="flex items-center gap-1">
                        <HugeiconsIcon icon={StarIcon} size={14} className="text-amber-400" />
                        <span className="font-bold text-sm tabular-nums">
                          {entry.xp.toLocaleString()}
                        </span>
                      </div>
                      {entry.streak > 0 && (
                        <div className="flex items-center gap-0.5 text-muted-foreground text-xs">
                          <HugeiconsIcon icon={FireIcon} size={12} />
                          <span className="tabular-nums">{entry.streak}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
