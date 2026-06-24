"use client";

import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useGamification } from "@/hooks/use-gamification";
import { cn } from "@/lib/utils";
import { iOSDecelerate } from "@/lib/utils/animation";

const challengeIcons: Record<string, typeof Target01Icon> = {
  questions: Target01Icon,
  accuracy: Target01Icon,
  streak: FireIcon,
  subject: Target01Icon,
};

const VARIANTS = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: iOSDecelerate, delay: i * 0.08 },
  }),
};

export function DailyChallenges() {
  const { gamification } = useGamification();

  const { active, completed } = useMemo(() => {
    const a: typeof gamification.dailyChallenges = [];
    const c: typeof gamification.dailyChallenges = [];
    for (const challenge of gamification.dailyChallenges) {
      if (challenge.completed) {
        c.push(challenge);
      } else {
        a.push(challenge);
      }
    }
    return { active: a, completed: c };
  }, [gamification.dailyChallenges]);

  if (active.length === 0 && completed.length === 0) return null;

  const allCompleted = completed.length === gamification.dailyChallenges.length;

  return (
    <div className="card-entrance">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-5 pt-5 pb-0">
          <CardTitle className="font-extrabold text-base tracking-tight">
            Daily Challenges
          </CardTitle>
          {allCompleted && (
            <m.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: iOSDecelerate }}
              className="rounded-full bg-success/15 px-2.5 py-0.5 font-semibold text-success-foreground text-xs"
            >
              All done
            </m.span>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-2.5 px-5 pt-4 pb-5">
          {[...active, ...completed].map((challenge, index) => {
            const Icon = challengeIcons[challenge.type] || Target01Icon;
            const progress =
              challenge.target > 0 ? Math.round((challenge.progress / challenge.target) * 100) : 0;

            return (
              <m.div
                key={challenge.id}
                variants={VARIANTS}
                initial="hidden"
                animate="visible"
                custom={index}
                className={cn(
                  "flex items-start gap-4 rounded-xl p-4 transition-[background-color] duration-300",
                  challenge.completed
                    ? "bg-success/8 ring-1 ring-success/15"
                    : "bg-muted/30 ring-1 ring-transparent hover:bg-muted/50",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl transition-colors",
                    challenge.completed
                      ? "bg-success/20 text-success"
                      : "bg-(--system-accent)/10 text-(--system-accent)",
                  )}
                >
                  {challenge.completed ? (
                    <m.div
                      initial={{ scale: 0.95, opacity: 0, rotate: -45 }}
                      animate={{ scale: 1, opacity: 1, rotate: 0 }}
                      transition={{ duration: 0.35, ease: iOSDecelerate }}
                    >
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} className="size-5" />
                    </m.div>
                  ) : (
                    <HugeiconsIcon icon={Icon} className="size-5" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-balance font-semibold text-sm leading-tight">
                      {challenge.title}
                    </p>
                    {challenge.completed && (
                      <span className="shrink-0 font-semibold text-success text-xs tabular-nums">
                        +{challenge.xpReward} XP
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {challenge.description}
                  </p>
                  {!challenge.completed && (
                    <div className="flex items-center gap-2 pt-1">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <m.div
                          initial={{ scaleX: 0 }}
                          animate={{
                            scaleX: Math.min(progress, 100) / 100,
                          }}
                          transition={{
                            duration: 0.6,
                            ease: iOSDecelerate,
                            delay: index * 0.08 + 0.2,
                          }}
                          className="h-full origin-left rounded-full bg-(--system-accent)"
                        />
                      </div>
                      <span className="font-medium text-muted-foreground text-xs tabular-nums">
                        {challenge.progress}/{challenge.target}
                      </span>
                    </div>
                  )}
                </div>
              </m.div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
