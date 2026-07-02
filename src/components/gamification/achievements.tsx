"use client";

import LockIcon from "@hugeicons/core-free-icons/LockIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { AchievementIcon } from "@/components/shared/achievement-icon";
import { rarityColors, rarityGlow } from "@/lib/utils/gamification";
import type { Achievement } from "@/types/gamification";

interface AchievementsProps {
  achievements: Achievement[];
}

export function Achievements({ achievements }: AchievementsProps) {
  const t = useTranslations();
  const { earnedCount, earnedAchievements, lockedAchievements } = useMemo(() => {
    const earned: Achievement[] = [];
    const locked: Achievement[] = [];
    for (const a of achievements) {
      if (a.earnedAt) {
        earned.push(a);
      } else {
        locked.push(a);
      }
    }
    return {
      earnedCount: earned.length,
      earnedAchievements: earned,
      lockedAchievements: locked,
    };
  }, [achievements]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-foreground text-sm">{t("gamification.achievements")}</h3>
        <span className="text-muted-foreground text-xs">
          {t("gamification.earnedOfTotal", {
            earned: earnedCount,
            total: achievements.length,
          })}
        </span>
      </div>

      <div className="scrollbar-hide flex gap-2 overflow-x-auto pb-2">
        {earnedAchievements.slice(0, 6).map((achievement) => (
          <m.button
            key={achievement.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`relative size-14 shrink-0 rounded-xl border-2 ${rarityColors[achievement.rarity]} ${rarityGlow[achievement.rarity]} flex items-center justify-center shadow-level-1 transition-transform press-scale`}
            title={t("gamification.achievementUnlocked", {
              name: achievement.name,
              description: achievement.description,
            })}
          >
            <AchievementIcon emoji={achievement.icon} className="size-6" />
            {achievement.rarity === "legendary" && (
              <span
                className="absolute inset-0 rounded-xl"
                style={{
                  boxShadow: "0 0 12px 2px oklch(81.9% 0.145 80° / 0.4)",
                }}
              />
            )}
          </m.button>
        ))}

        {lockedAchievements.slice(0, 3).map((achievement, index) => (
          <m.div
            key={achievement.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: (earnedAchievements.length + index) * 0.05 }}
            className="relative flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-border border-dashed bg-muted/30"
            title={t("gamification.achievementLocked", {
              name: achievement.name,
            })}
          >
            <HugeiconsIcon icon={LockIcon} className="size-5 grayscale" />
          </m.div>
        ))}

        {achievements.length > 9 && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            className="flex size-14 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/30 text-muted-foreground text-xs"
          >
            +{achievements.length - 9}
          </m.div>
        )}
      </div>
    </div>
  );
}
