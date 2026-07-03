"use client";

import Award01Icon from "@hugeicons/core-free-icons/Award01Icon";
import Award02Icon from "@hugeicons/core-free-icons/Award02Icon";
import Award03Icon from "@hugeicons/core-free-icons/Award03Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import BookOpen02Icon from "@hugeicons/core-free-icons/BookOpen02Icon";
import BrainIcon from "@hugeicons/core-free-icons/BrainIcon";
import Briefcase01Icon from "@hugeicons/core-free-icons/Briefcase01Icon";
import Calendar01Icon from "@hugeicons/core-free-icons/Calendar01Icon";
import ChartBarBigIcon from "@hugeicons/core-free-icons/ChartBarBigIcon";
import ChartLineData01Icon from "@hugeicons/core-free-icons/ChartLineData01Icon";
import CrownIcon from "@hugeicons/core-free-icons/CrownIcon";
import DiamondIcon from "@hugeicons/core-free-icons/DiamondIcon";
import DiceIcon from "@hugeicons/core-free-icons/DiceIcon";
import File02Icon from "@hugeicons/core-free-icons/File02Icon";
import FireIcon from "@hugeicons/core-free-icons/FireIcon";
import GlobeIcon from "@hugeicons/core-free-icons/GlobeIcon";
import LockIcon from "@hugeicons/core-free-icons/LockIcon";
import MedalFirstPlaceIcon from "@hugeicons/core-free-icons/MedalFirstPlaceIcon";
import MedalSecondPlaceIcon from "@hugeicons/core-free-icons/MedalSecondPlaceIcon";
import MedalThirdPlaceIcon from "@hugeicons/core-free-icons/MedalThirdPlaceIcon";
import MicroscopeIcon from "@hugeicons/core-free-icons/MicroscopeIcon";
import Mortarboard01Icon from "@hugeicons/core-free-icons/Mortarboard01Icon";
import HashIcon from "@hugeicons/core-free-icons/HashIcon";
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon";
import IceCubesIcon from "@hugeicons/core-free-icons/IceCubesIcon";
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon";
import StarIcon from "@hugeicons/core-free-icons/StarIcon";
import Target01Icon from "@hugeicons/core-free-icons/Target01Icon";
import TestTubeIcon from "@hugeicons/core-free-icons/TestTubeIcon";
import VoiceIcon from "@hugeicons/core-free-icons/VoiceIcon";
import WorkoutSportIcon from "@hugeicons/core-free-icons/WorkoutSportIcon";
import ZapIcon from "@hugeicons/core-free-icons/ZapIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import type { IconSvgElement } from "@hugeicons/react";

const iconMap: Record<string, IconSvgElement> = {
  "🎯": Target01Icon,
  "🔥": FireIcon,
  "💪": WorkoutSportIcon,
  "🏆": Award01Icon,
  "📚": BookOpen01Icon,
  "🎓": Mortarboard01Icon,
  "⭐": StarIcon,
  "🌟": StarIcon,
  "🧠": BrainIcon,
  "💎": DiamondIcon,
  "✨": SparklesIcon,
  "👑": CrownIcon,
  "🔬": MicroscopeIcon,
  "🔢": HashIcon,
  "🎲": DiceIcon,
  "🧪": TestTubeIcon,
  "📖": BookOpen02Icon,
  "🗣️": VoiceIcon,
  "💼": Briefcase01Icon,
  "📊": ChartBarBigIcon,
  "🌍": GlobeIcon,
  "🔄": RefreshIcon,
  "⚡": ZapIcon,
  "📈": ChartLineData01Icon,
  "📅": Calendar01Icon,
  "📝": File02Icon,
  "🥇": MedalFirstPlaceIcon,
  "🥈": MedalSecondPlaceIcon,
  "🥉": MedalThirdPlaceIcon,
  "🏅": Award02Icon,
  "🎖️": Award03Icon,
  "🔒": LockIcon,
  "🌈": GlobeIcon,
  "🧊": IceCubesIcon,
  "🪵": DiamondIcon,
  "🪨": DiamondIcon,
  Award01Icon: Award01Icon,
  Award02Icon: Award02Icon,
  Award03Icon: Award03Icon,
  CardIcon: BookOpen01Icon,
  File02Icon: File02Icon,
  FireIcon: FireIcon,
  MedalFirstPlaceIcon: MedalFirstPlaceIcon,
  MedalSecondPlaceIcon: MedalSecondPlaceIcon,
  MedalThirdPlaceIcon: MedalThirdPlaceIcon,
  Target01Icon: Target01Icon,
};

interface AchievementIconProps {
  emoji: string;
  className?: string;
}

export function AchievementIcon({ emoji, className }: AchievementIconProps) {
  const Icon = iconMap[emoji];
  if (!Icon) {
    return <span className={className}>{emoji}</span>;
  }
  return <HugeiconsIcon icon={Icon} className={className} />;
}
