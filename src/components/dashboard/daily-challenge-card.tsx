"use client";

import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import ZapIcon from "@hugeicons/core-free-icons/ZapIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { useGamificationContext } from "@/contexts/gamification-provider";

interface DailyChallengeCardProps {
  streak: number;
}

export function DailyChallengeCard({ streak }: DailyChallengeCardProps) {
  const { gamification } = useGamificationContext();
  const { push } = useNavigationDirection();

  const todayStr = useMemo(() => new Date().toDateString(), []);
  const isDue = gamification.lastPracticeDate !== todayStr;

  const handleOpen = useCallback(() => {
    push("/quiz?mode=bolt");
  }, [push]);

  if (!isDue) return null;

  return (
    <div className="card-entrance">
      <Card className="overflow-hidden rounded-card shadow-level-1 ring-1 ring-warning/15 transition-[background-color] duration-300 hover:bg-muted/30">
        <CardContent className="flex items-center gap-4 p-5">
          <div className="relative flex size-12 shrink-0 items-center justify-center rounded-2xl bg-warning/15">
            <div
              className="absolute inset-0 animate-pulse rounded-2xl bg-warning/30 blur-md motion-reduce:animate-none"
              style={{ animationDuration: "2.4s" }}
            />
            <HugeiconsIcon
              icon={SparklesIcon}
              className="relative size-6 text-warning"
              strokeWidth={2.25}
            />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold font-sans text-sm text-system-text-primary text-balance tracking-tight">
                Today&rsquo;s Challenge
              </h3>
              {streak > 1 && (
                <div className="flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5">
                  <HugeiconsIcon icon={ZapIcon} className="size-3 text-warning" strokeWidth={2.5} />
                  <span className="font-semibold text-(--fs-caption-3) text-warning tabular-nums">
                    {streak}x
                  </span>
                </div>
              )}
            </div>
            <p className="truncate text-muted-foreground text-xs">Your weakest subject</p>
          </div>
          <Button size="sm" className="shrink-0 gap-1.5 press-scale" onClick={handleOpen}>
            Take Challenge
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
