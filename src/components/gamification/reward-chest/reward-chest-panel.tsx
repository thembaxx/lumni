"use client";

import GiftIcon from "@hugeicons/core-free-icons/GiftIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { rarityBorder } from "@/lib/utils/gamification";

const rarityColors: Record<string, string> = {
  common: "text-zinc-400 dark:text-zinc-300",
  rare: "text-blue-400 dark:text-blue-300",
  epic: "text-purple-400 dark:text-purple-300",
  legendary: "text-amber-400 dark:text-amber-300",
};

export function RewardChestPanel() {
  const { rewardChests, claimedChests } = useGamification();
  const claimedIds = new Set(claimedChests.map((c) => c.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={GiftIcon} size={18} className="text-accent" />
        <span className="font-medium text-sm">Reward Chests</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {rewardChests.map((chest) => {
          const claimed = claimedIds.has(chest.id);
          return (
            <m.div
              key={chest.id}
              className={cn(
                "relative flex items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                claimed
                  ? "border-border/30 opacity-50"
                  : rarityBorder[chest.rarity as keyof typeof rarityBorder],
              )}
              whileHover={claimed ? {} : { scale: 1.05 }}
            >
              <span className="text-base">{chest.icon}</span>
              <div>
                <p
                  className={cn(
                    "font-medium",
                    claimed ? "text-muted-foreground" : rarityColors[chest.rarity],
                  )}
                >
                  {chest.name}
                </p>
                <p className="text-muted-foreground">
                  {claimed
                    ? `${chest.xpReward} XP earned`
                    : `${chest.xpRequired.toLocaleString()} XP`}
                </p>
              </div>
            </m.div>
          );
        })}
      </div>
    </div>
  );
}
