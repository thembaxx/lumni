"use client";

import BulbIcon from "@hugeicons/core-free-icons/BulbIcon";
import HappyIcon from "@hugeicons/core-free-icons/HappyIcon";
import HeartIcon from "@hugeicons/core-free-icons/HeartIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import ThumbsUpIcon from "@hugeicons/core-free-icons/ThumbsUpIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

const REACTION_ICONS: Record<string, IconSvgElement> = {
  "👍": ThumbsUpIcon,
  "❤️": HeartIcon,
  "😂": HappyIcon,
  "🎉": SparklesIcon,
  "💡": BulbIcon,
};

const PRESET_EMOJIS = Object.keys(REACTION_ICONS);

interface ReactionBarProps {
  reactions: { emoji: string; userId: string; count: number }[];
  currentUserId?: string;
  onToggle: (emoji: string) => void;
  className?: string;
}

export function ReactionBar({ reactions, currentUserId, onToggle, className }: ReactionBarProps) {
  const getCount = useCallback(
    (id: string) => reactions.find((r) => r.emoji === id)?.count ?? 0,
    [reactions],
  );

  const hasReacted = useCallback(
    (id: string) => reactions.some((r) => r.emoji === id && r.userId === currentUserId),
    [reactions, currentUserId],
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {PRESET_EMOJIS.map((emoji) => {
        const count = getCount(emoji);
        if (count === 0) return null;
        const IconComponent = REACTION_ICONS[emoji];
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onToggle(emoji)}
            className={cn(
              "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs transition-colors",
              hasReacted(emoji)
                ? "bg-(--system-accent)/10 text-(--system-accent)"
                : "bg-(--system-surface) text-(--system-text-secondary) hover:bg-(--system-surface-hover)",
            )}
          >
            {IconComponent ? (
              <HugeiconsIcon icon={IconComponent} className="size-4" data-icon />
            ) : (
              <span>{emoji}</span>
            )}
            {count > 1 && <span>{count}</span>}
          </button>
        );
      })}
      <button
        type="button"
        onClick={() => onToggle("+")}
        className="flex items-center rounded-full px-2 py-0.5 text-(--system-text-tertiary) text-xs transition-colors hover:bg-(--system-surface-hover)"
        title="Add reaction"
      >
        +
      </button>
    </div>
  );
}
