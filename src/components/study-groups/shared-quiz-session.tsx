"use client";

import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";
import { useSharedQuiz } from "@/hooks/use-shared-quiz";
import type { SharedQuizParticipant } from "@/hooks/use-shared-quiz";

interface SharedQuizSessionProps {
  channelName: string;
  totalQuestions: number;
  className?: string;
}

function ParticipantRow({
  participant,
  isCurrentUser,
  totalQuestions,
}: {
  participant: SharedQuizParticipant;
  isCurrentUser: boolean;
  totalQuestions: number;
}) {
  const progressPercent =
    totalQuestions > 0 ? Math.round((participant.progress / totalQuestions) * 100) : 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border p-3 transition-colors",
        isCurrentUser && "border-(--system-accent)/40 bg-(--system-accent)/5",
      )}
    >
      <div
        className={cn(
          "flex size-8 shrink-0 items-center justify-center rounded-full font-bold text-sm",
          isCurrentUser
            ? "bg-(--system-accent)/10 text-(--system-accent)"
            : "bg-muted text-muted-foreground",
        )}
      >
        {(participant.userName ?? "?")[0]?.toUpperCase() ?? "?"}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="truncate font-medium text-sm">
            {participant.userName}
            {isCurrentUser && (
              <span className="ml-1.5 text-(--fs-caption-3) text-muted-foreground">(you)</span>
            )}
          </span>
          <span className="font-bold text-sm tabular-nums">{participant.score}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-(--system-accent) transition-all duration-500"
              style={{ width: `${Math.min(progressPercent, 100)}%` }}
            />
          </div>
          <span className="text-(--fs-caption-3) text-muted-foreground tabular-nums">
            {participant.progress}/{totalQuestions}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SharedQuizSession({
  channelName,
  totalQuestions,
  className,
}: SharedQuizSessionProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const { participants, isConnected } = useSharedQuiz(channelName);

  if (!participants.length && !isConnected) return null;

  const sorted = [...participants].toSorted((a, b) => b.score - a.score);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <HugeiconsIcon icon={UserGroupIcon} className="size-4 text-muted-foreground" data-icon />
        <span className="font-medium text-sm">
          {t("common.participants", { count: participants.length })}
        </span>
        {isConnected && (
          <span className="ml-auto flex items-center gap-1 text-(--fs-caption-3) text-success">
            <span className="block size-1.5 rounded-full bg-success" />
            Live
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2">
        {sorted.map((p) => (
          <ParticipantRow
            key={p.userId}
            participant={p}
            isCurrentUser={p.userId === user?.$id}
            totalQuestions={totalQuestions}
          />
        ))}
      </div>

      {sorted.length > 1 && (
        <p className="text-(--fs-caption-2) text-center text-muted-foreground">
          {sorted[0]?.userId === user?.$id
            ? "You're in the lead!"
            : `You're ${(sorted[1]?.score ?? 0) - (sorted.find((p) => p.userId === user?.$id)?.score ?? 0) > 0 ? "behind by" : "ahead by"} ${Math.abs((sorted.find((p) => p.userId === user?.$id)?.score ?? 0) - (sorted[0]?.score ?? 0))} point${Math.abs((sorted.find((p) => p.userId === user?.$id)?.score ?? 0) - (sorted[0]?.score ?? 0)) === 1 ? "" : "s"}`}
        </p>
      )}
    </div>
  );
}
