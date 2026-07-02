"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { rarityBorder, rarityGlowStrong, raritySolid } from "@/lib/utils/gamification";

interface AchievementUnlockProps {
  visible: boolean;
  icon: string;
  name: string;
  description: string;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
  onClose?: () => void;
}

export function AchievementUnlock({
  visible,
  icon,
  name,
  description,
  xpReward,
  rarity,
  onClose,
}: AchievementUnlockProps) {
  return (
    <Dialog open={visible} onOpenChange={(o) => !o && onClose?.()}>
      <DialogContent showCloseButton={false} className="max-w-sm sm:max-w-sm">
        <DialogTitle className="sr-only">Achievement Unlocked</DialogTitle>
        <div className="relative">
          <div className={`absolute inset-0 rounded-3xl blur-xl ${raritySolid[rarity]}/50`} />

          <div
            className={`relative border-2 bg-card ${rarityBorder[rarity]} rounded-3xl p-8 text-center shadow-level-3 ${rarityGlowStrong[rarity]}`}
          >
            <m.div
              initial={{ opacity: 0, scale: 0.5, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 200, damping: 14, bounce: 0.4 }}
              className="mb-4"
            >
              <m.div animate={{ scale: [1, 1.25, 1] }} transition={{ duration: 0.4, delay: 0.5 }}>
                <div className="mb-4 text-7xl">{icon}</div>
              </m.div>
            </m.div>

            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className="mb-2 flex items-center justify-center gap-2">
                <HugeiconsIcon icon={Award01Icon} className="size-5 text-warning" />
                <span className="font-medium text-sm text-warning uppercase tracking-wider">
                  Achievement Unlocked!
                </span>
              </div>
              <h2 className="balance mb-2 text-wrap font-semibold text-2xl">{name}</h2>
              <p className="mb-4 text-muted-foreground">{description}</p>
              <div className="inline-flex items-center gap-2 rounded-full bg-warning/20 px-4 py-2 text-warning-foreground">
                <span className="font-semibold text-lg tabular-nums">+{xpReward} XP</span>
              </div>
            </m.div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
