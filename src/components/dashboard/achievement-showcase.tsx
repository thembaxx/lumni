"use client";

import { AchievementIcon } from "@/components/shared/achievement-icon";
import { FadeIn } from "@/components/shared/fade-in";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamificationContext } from "@/contexts/gamification-provider";
import { cn } from "@/lib/utils";

const rarityColors: Record<string, string> = {
  common: "bg-muted text-muted-foreground",
  rare: "bg-info/10 text-info",
  epic: "bg-success/10 text-success",
  legendary: "bg-warning/10 text-warning",
};

export function AchievementShowcase() {
  const { gamification } = useGamificationContext();

  const earned = gamification.achievements.filter((a) => a.earnedAt);
  if (earned.length === 0) return null;

  const latest = earned.slice(-3).toReversed();

  return (
    <FadeIn direction="up" distance={16}>
      <Card className="rounded-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-bold text-base tracking-tight text-balance">
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {earned.length > 0 && (
            <p className="mb-1 text-muted-foreground text-xs">
              <span className="tabular-nums">{earned.length}</span> of{" "}
              <span className="tabular-nums">{gamification.achievements.length}</span> unlocked
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {latest.map((achievement) => (
              <div
                key={achievement.id}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 font-medium text-xs",
                  rarityColors[achievement.rarity] || rarityColors.common,
                )}
              >
                <AchievementIcon emoji={achievement.icon} className="size-4" />
                <span>{achievement.name}</span>
              </div>
            ))}
            {earned.length > 3 && (
              <div className="flex items-center rounded-full bg-muted px-3 py-1.5 font-medium text-muted-foreground text-xs tabular-nums">
                +{earned.length - 3} more
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </FadeIn>
  );
}
