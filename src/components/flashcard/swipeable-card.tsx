"use client";

import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { memo, useMemo, useState } from "react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import { TTSButton } from "@/components/shared/tts-button";
import { cn } from "@/lib/utils";
import { iOSEase } from "@/lib/utils/animation";
import { haptics } from "@/lib/utils/haptics";
import { projectMomentum, springPresets } from "@/lib/utils/spring-presets";

interface SwipeableCardProps {
  id: string;
  front: string;
  back: string;
  topic?: string;
  difficulty?: string;
  hint?: string;
  subject?: string;
  isTop: boolean;
  mode: "simple" | "sm2";
  onSwipe: (direction: "left" | "right") => void;
  style?: React.CSSProperties;
}

const BACKFACE_HIDDEN = { backfaceVisibility: "hidden" as const };
const ROTATED_BACKFACE = {
  transform: "rotateY(180deg)",
  backfaceVisibility: "hidden" as const,
};

export const SwipeableCard = memo(function SwipeableCard({
  id: _id,
  front,
  back,
  topic,
  difficulty,
  hint,
  subject,
  isTop,
  mode: _mode,
  onSwipe,
  style,
}: SwipeableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const flipAnim = useMemo(() => ({ rotateY: isFlipped ? 180 : 0 }), [isFlipped]);
  const prefersReducedMotion = useReducedMotion();

  const x = useMotionValue(0);
  const HARD_THRESHOLD = 100;

  const rotate = useTransform(x, [-300, 0, 300], [-18, 0, 18]);
  const rotateY = useTransform(x, [-300, 0, 300], [6, 0, -6]);
  const opacity = useTransform(x, [-200, 0, 200], [0.85, 1, 0.85]);
  const scale3d = useTransform(x, [-300, 0, 300], [0.94, 1, 0.94]);
  const background = useTransform(
    x,
    [-300, -150, -80, -30, 0, 30, 80, 150, 300],
    [
      "linear-gradient(135deg, color-mix(in oklch, var(--color-destructive) 25%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-destructive) 20%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-destructive) 15%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-destructive) 5%, transparent) 0%, transparent 100%)",
      "transparent",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-success) 5%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-success) 15%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-success) 20%, transparent) 0%, transparent 100%)",
      "linear-gradient(135deg, color-mix(in oklch, var(--color-success) 25%, transparent) 0%, transparent 100%)",
    ],
  );

  function handleDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: { offset: { x: number }; velocity: { x: number } },
  ) {
    if (prefersReducedMotion) {
      const direction = info.offset.x > 0 ? "right" : "left";
      onSwipe(direction);
      return;
    }

    const xOffset = info.offset.x;
    const xVelocity = info.velocity.x;
    const absOffset = Math.abs(xOffset);

    if (absOffset > HARD_THRESHOLD || Math.abs(xVelocity) > 500) {
      const direction = xOffset > 0 || xVelocity > 0 ? "right" : "left";
      const projection = projectMomentum(xVelocity);
      const baseTarget = direction === "right" ? 600 : -600;
      const targetX = baseTarget + (direction === "right" ? projection : -projection);

      haptics.light();

      animate(x, targetX, {
        ...springPresets.cardExit,
        velocity: xVelocity,
        onComplete: () => {
          onSwipe(direction);
          x.set(0);
        },
      });
    } else {
      animate(x, 0, springPresets.standard);
    }
  }

  function handleTap() {
    if (isTop) {
      setIsFlipped((prev) => !prev);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isTop || e.repeat) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleTap();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      onSwipe("left");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      onSwipe("right");
    }
  }

  return (
    <m.div
      className={cn(
        "absolute inset-0 motion-reduce:animate-none motion-reduce:transition-none active:cursor-grabbing",
        isTop ? "z-elevated" : "pointer-events-none z-0",
      )}
      style={
        style
          ? { ...style, x, rotate, opacity, scale: scale3d }
          : { x, rotate, opacity, scale: scale3d }
      }
      aria-disabled={!isTop}
      data-testid="swipeable-card"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={prefersReducedMotion ? 0 : 0.3}
      onDragEnd={isTop ? handleDragEnd : undefined}
      onTap={isTop ? handleTap : undefined}
      whileDrag={{
        scale: 1.04,
        cursor: "grabbing",
        transition: { duration: 0.2 },
      }}
      layout
      tabIndex={isTop ? 0 : -1}
      role="button"
      aria-roledescription="flashcard"
      aria-label={`Flashcard: ${front}`}
      aria-describedby={isFlipped && hint ? `${_id}-hint` : undefined}
      aria-expanded={isFlipped}
      onKeyDown={isTop ? handleKeyDown : undefined}
    >
      <m.div
        className="perspective-1000 relative h-full w-full"
        style={{ transformStyle: "preserve-3d", perspective: "1000px", rotateY }}
      >
        <m.div
          className="relative h-full w-full"
          style={{ transformStyle: "preserve-3d" }}
          animate={flipAnim}
          transition={{ duration: 0.2, ease: iOSEase }}
        >
          {/* Front */}
          <div
            data-testid="card-front"
            className="backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2"
            style={BACKFACE_HIDDEN}
          >
            {isTop && (
              <m.div
                className="pointer-events-none absolute inset-0 rounded-card-lg"
                style={{ background }}
              />
            )}

            <div className="mb-4 flex items-center gap-2">
              {topic && (
                <span
                  data-testid="card-topic"
                  className="ios-caption-2 rounded-md bg-(--system-accent-alpha-10) px-2 py-0.5 font-medium text-(--system-accent)"
                >
                  {topic}
                </span>
              )}
              {difficulty && (
                <span className="ios-caption-2 rounded-md bg-muted px-2 py-0.5 font-mono text-muted-foreground">
                  {difficulty}
                </span>
              )}
              <div className="ml-auto">
                <TTSButton text={front} />
              </div>
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="text-center font-medium text-lg">
                <MarkdownRenderer content={front} subject={subject} />
              </div>
            </div>

            {isTop && !isFlipped && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground text-xs">Tap or press Space/Enter to flip</p>
              </div>
            )}
          </div>

          {/* Back */}
          <div
            data-testid="card-back"
            className="backface-hidden absolute inset-0 flex flex-col rounded-card-lg border border-border/80 bg-card p-6 shadow-level-2"
            style={ROTATED_BACKFACE}
          >
            <div className="mb-2 flex items-center justify-end">
              <TTSButton text={back} />
            </div>

            <div className="flex flex-1 items-center justify-center">
              <div className="text-center">
                <MarkdownRenderer content={back} subject={subject} />
              </div>
            </div>

            {hint && (
              <div
                id={`${_id}-hint`}
                className="mt-4 rounded-lg bg-warning/10 p-3 dark:bg-warning/20"
              >
                <p className="text-warning text-xs">Hint: {hint}</p>
              </div>
            )}

            {isTop && isFlipped && (
              <div className="mt-4 text-center">
                <p className="text-muted-foreground text-xs">
                  Swipe right if correct, left if incorrect. Arrow keys or Space/Enter to flip.
                </p>
              </div>
            )}
          </div>
        </m.div>
      </m.div>
    </m.div>
  );
});
