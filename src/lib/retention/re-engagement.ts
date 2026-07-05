export interface ReEngagementContext {
  daysSinceLastActive: number;
  previousStreakLength: number;
  subjectDiversity: number;
  lastActiveSubject: string | null;
  weakestTopic: { subject: string; topic: string; score: number } | null;
  streak: number;
  dailyChallengeComplete: boolean;
  suppressedRuleIds: string[];
}

export interface ReEngagementContent {
  ruleId: string;
  title: string;
  body: string;
  deepLink: string;
}

export function calculateReEngagementScore(ctx: ReEngagementContext): number {
  const daysScore = Math.min(ctx.daysSinceLastActive, 30) * 0.5;
  const streakScore = Math.min(ctx.previousStreakLength, 100) * 0.3;
  const diversityScore = Math.min(ctx.subjectDiversity, 10) * 0.2;
  return daysScore + streakScore + diversityScore;
}

function getTimeOfDay(): "morning" | "afternoon" | "evening" {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const TEMPLATES: Record<string, (ctx: ReEngagementContext) => ReEngagementContent> = {
  "morning-streak": (ctx) => ({
    ruleId: "morning-streak",
    title: "Streak Waiting!",
    body: `Your ${ctx.lastActiveSubject ?? "study"} streak is waiting — pick up where you left off!`,
    deepLink: "/dashboard",
  }),
  "afternoon-weakest": (ctx) => ({
    ruleId: "afternoon-weakest",
    title: "Quick Practice",
    body: `Quick quiz: ${ctx.weakestTopic?.topic ?? "your weakest topic"} needs practice. Just 5 questions!`,
    deepLink: ctx.weakestTopic
      ? `/quiz?subject=${encodeURIComponent(ctx.weakestTopic.subject)}&topic=${encodeURIComponent(ctx.weakestTopic.topic)}&count=5`
      : "/quiz?count=5",
  }),
  "evening-challenge": () => ({
    ruleId: "evening-challenge",
    title: "Challenge Ready!",
    body: "Today's challenge is ready — finish it before midnight!",
    deepLink: "/dashboard",
  }),
  "long-dormant-7": (ctx) => ({
    ruleId: "long-dormant-7",
    title: "We Miss You!",
    body: `${ctx.lastActiveSubject ?? "Your subjects"} miss you! Try a 5-question warmup to get back in.`,
    deepLink: ctx.lastActiveSubject
      ? `/quiz?subject=${encodeURIComponent(ctx.lastActiveSubject)}&count=5`
      : "/quiz?count=5",
  }),
  "long-dormant-14": () => ({
    ruleId: "long-dormant-14",
    title: "Welcome Back!",
    body: "It's been a while! Here's your personalized refresher — 3 questions to ease back in.",
    deepLink: "/quiz?count=3",
  }),
};

export function selectReEngagementContent(ctx: ReEngagementContext): ReEngagementContent | null {
  const tod = getTimeOfDay();

  if (ctx.daysSinceLastActive > 14 && !ctx.suppressedRuleIds.includes("long-dormant-14")) {
    return TEMPLATES["long-dormant-14"](ctx);
  }

  if (ctx.daysSinceLastActive > 7 && !ctx.suppressedRuleIds.includes("long-dormant-7")) {
    return TEMPLATES["long-dormant-7"](ctx);
  }

  if (ctx.daysSinceLastActive <= 3 || ctx.daysSinceLastActive === 0) {
    return null;
  }

  if (tod === "morning" && ctx.streak > 3 && !ctx.suppressedRuleIds.includes("morning-streak")) {
    return TEMPLATES["morning-streak"](ctx);
  }

  if (
    tod === "afternoon" &&
    ctx.weakestTopic &&
    ctx.weakestTopic.score < 60 &&
    !ctx.suppressedRuleIds.includes("afternoon-weakest")
  ) {
    return TEMPLATES["afternoon-weakest"](ctx);
  }

  if (
    tod === "evening" &&
    !ctx.dailyChallengeComplete &&
    !ctx.suppressedRuleIds.includes("evening-challenge")
  ) {
    return TEMPLATES["evening-challenge"](ctx);
  }

  return null;
}
