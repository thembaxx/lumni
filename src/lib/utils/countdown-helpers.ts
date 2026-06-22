const NSC_FINAL_DATE = new Date("2026-10-12");
const NSC_YEAR_START = new Date("2026-01-14");

export type TimeOfDay = "morning" | "afternoon" | "evening";
export type Phase = "foundation" | "grind" | "intensify" | "final";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 18) return "afternoon";
  return "evening";
}

export function getDaysUntil(): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(NSC_FINAL_DATE);
  target.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getYearProgress(): number {
  const now = new Date();
  const start = NSC_YEAR_START.getTime();
  const end = NSC_FINAL_DATE.getTime();
  const elapsed = now.getTime() - start;
  return Math.min(1, Math.max(0, elapsed / (end - start)));
}

export const greetingMap: Record<TimeOfDay, string> = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
};

export const phaseConfigs: Record<
  Phase,
  {
    glowClass: string;
    glow2Class: string;
    barLight: string;
  }
> = {
  foundation: {
    glowClass: "bg-system-accent/10",
    glow2Class: "bg-system-accent/5",
    barLight: "bg-system-accent",
  },
  grind: {
    glowClass: "bg-system-accent/15",
    glow2Class: "bg-system-accent/8",
    barLight: "bg-system-accent",
  },
  intensify: {
    glowClass: "bg-warning/15",
    glow2Class: "bg-system-accent/15",
    barLight: "bg-warning",
  },
  final: {
    glowClass: "bg-destructive/15",
    glow2Class: "bg-warning/15",
    barLight: "bg-destructive",
  },
};

export function getPhase(daysLeft: number): Phase {
  if (daysLeft > 90) return "foundation";
  if (daysLeft > 60) return "grind";
  if (daysLeft > 30) return "intensify";
  return "final";
}

const encouragements = [
  "Small steps every day build unstoppable momentum.",
  "Your brain learns best in focused 25-minute bursts.",
  "Reviewing past papers is the fastest path to confidence.",
  "Sleep is when your brain consolidates memory. Don't skip it.",
  "Teaching a concept to someone else locks it in your mind.",
  "The Pomodoro technique: 25 min study, 5 min break. Try it.",
  "Active recall beats re-reading. Quiz yourself, don't just read.",
  "Mix up your subjects to keep your brain engaged.",
  "Explain it out loud. If you can say it, you know it.",
  "Your mistakes are just data. Review them, learn, move on.",
];

function todaysSeed(): number {
  const date = new Date();
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

function pickEncouragement(): string {
  const seed = todaysSeed();
  return encouragements[seed % encouragements.length];
}

export function getMessage(
  daysLeft: number,
  firstName: string | null,
): { primary: string; subtitle: string } {
  const name = firstName ?? "keep pushing";
  const tip = pickEncouragement();
  if (daysLeft > 90)
    return {
      primary: `Build your foundation, ${name}`,
      subtitle: tip,
    };
  if (daysLeft > 60)
    return {
      primary: `Keep pushing, ${name}`,
      subtitle: tip,
    };
  if (daysLeft > 30)
    return {
      primary: `The grind is real, ${name}`,
      subtitle: tip,
    };
  if (daysLeft > 14)
    return {
      primary: `Final stretch, ${name}`,
      subtitle: tip,
    };
  if (daysLeft > 7)
    return {
      primary: `${name}, this is it`,
      subtitle: tip,
    };
  return {
    primary: `${name}, believe`,
    subtitle: tip,
  };
}

type Milestone = { days: number; label: string; emoji: string } | null;

export function getMilestone(daysLeft: number): Milestone {
  if (daysLeft === 30) return { days: 30, label: "One month left", emoji: "30" };
  if (daysLeft === 14) return { days: 14, label: "Two weeks to go", emoji: "14" };
  if (daysLeft === 7) return { days: 7, label: "One week to go", emoji: "7" };
  if (daysLeft === 90) return { days: 90, label: "90 days remaining", emoji: "90" };
  return null;
}
