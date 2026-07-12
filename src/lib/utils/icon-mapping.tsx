"use client";

import AlertCircleIcon from "@hugeicons/core-free-icons/AlertCircleIcon";
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import CancelCircleIcon from "@hugeicons/core-free-icons/CancelCircleIcon";
import CheckmarkCircle01Icon from "@hugeicons/core-free-icons/CheckmarkCircle01Icon";
import CrownIcon from "@hugeicons/core-free-icons/CrownIcon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import PartyIcon from "@hugeicons/core-free-icons/PartyIcon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import Upload01Icon from "@hugeicons/core-free-icons/Upload01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import type { ComponentProps } from "react";

export type AnimationPreset = "shake" | "scale";

interface IconMappingEntry {
  icon: typeof CheckmarkCircle01Icon;
  size: number;
  animation?: AnimationPreset;
}

const animationPresets: Record<AnimationPreset, ComponentProps<typeof m.div>["animate"]> = {
  shake: { x: [-5, 5, -5, 5, 0] },
  scale: { opacity: [0, 1], scale: [0.25, 1] },
};

const animationTransitions: Record<AnimationPreset, ComponentProps<typeof m.div>["transition"]> = {
  shake: { duration: 0.4 },
  scale: { type: "spring", duration: 0.3, bounce: 0 },
};

const animationMapping: Record<string, IconMappingEntry> = {
  "achievement-unlock": { icon: Award01Icon, size: 12, animation: "scale" },
  confetti: { icon: PartyIcon, size: 16 },
  "empty-search": { icon: Search01Icon, size: 12 },
  "empty-upload": { icon: Upload01Icon, size: 12 },
  "error-state": { icon: AlertCircleIcon, size: 16, animation: "shake" },
  "level-up": { icon: CrownIcon, size: 16 },
  "loading-dots": { icon: RadialIcon, size: 4 },
  "loading-lumni": { icon: RadialIcon, size: 14 },
  "page-404": { icon: ArrowLeft01Icon, size: 6 },
  "quiz-correct": { icon: CheckmarkCircle01Icon, size: 5, animation: "scale" },
  "quiz-incorrect": { icon: CancelCircleIcon, size: 5, animation: "shake" },
  "streak-fire": { icon: FireIcon, size: 6 },
  "success-check": {
    icon: CheckmarkCircle01Icon,
    size: 10,
    animation: "scale",
  },
  "typing-indicator": { icon: RadialIcon, size: 7 },
  "xp-burst": { icon: SparklesIcon, size: 8 },
};

export type LottieAnimationName = keyof typeof animationMapping;

export function AnimatedIcon({
  name,
  className,
  ...props
}: {
  name: LottieAnimationName;
  className?: string;
} & Omit<ComponentProps<typeof m.div>, "animate" | "transition">) {
  const mapping = animationMapping[name];
  if (!mapping) return null;

  const { icon: Icon, size, animation } = mapping;
  const animateProps = animation ? animationPresets[animation] : undefined;
  const transitionProps = animation ? animationTransitions[animation] : undefined;

  return (
    <m.div className={className} animate={animateProps} transition={transitionProps} {...props}>
      <HugeiconsIcon icon={Icon} size={size} />
    </m.div>
  );
}
