function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://lumni-psi.vercel.app"
  );
}

export const appConfig = {
  name: "Lumni",
  shortName: "Lumni",
  descriptionShort: "Pass your Matric with confidence.",
  description:
    "Pass your Matric with confidence. Lumni is your AI-powered study companion, offering personalized quizzes, flashcards, past papers, and a smart study planner to help you ace your exams.",
  version: {
    current: "1.0.0",
    build: process.env.NEXT_PUBLIC_BUILD_VERSION || "dev",
    commit: process.env.NEXT_PUBLIC_COMMIT_HASH || "unknown",
    timestamp: process.env.NEXT_PUBLIC_BUILD_TIMESTAMP || "",
  },
  get siteUrl(): string {
    return getSiteUrl();
  },
  links: {
    website: getSiteUrl(),
    support: `${getSiteUrl()}/support`,
    privacy: "/privacy",
    terms: "/terms",
    cookiePolicy: "/cookie-policy",
    feedback: `${getSiteUrl()}/feedback`,
  },
  legal: {
    tosVersion: "1.0.0",
    privacyVersion: "1.0.0",
  },
  contact: {
    email: "hello@lumni.ai",
    supportEmail: "support@lumni.ai",
    hours: "Mon-Fri: 9AM-6PM SAST",
  },
  nsc: {
    minAps: 20,
    maxAps: 50,
    defaultTargetAps: 42,
  },
  paths: {
    dashboard: "/dashboard",
    quiz: "/quiz",
    flashcards: "/flashcards",
    pastPapers: "/past-papers",
    studyPlan: "/study-plan",
    settings: "/settings",
  },
};
