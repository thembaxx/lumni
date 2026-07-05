import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryOverview } from "@/components/navigation/category-overview";

export const metadata: Metadata = {
  title: "Learn - Lumni",
};

const items = [
  {
    label: "Quiz",
    description: "Practice with AI-generated questions",
    href: "/quiz",
    icon: "Quiz01Icon",
  },
  {
    label: "Flashcards",
    description: "Review with spaced repetition",
    href: "/flashcards",
    icon: "FlashIcon",
  },
  {
    label: "Problems",
    description: "Solve challenging problems",
    href: "/problems",
    icon: "BookOpen01Icon",
  },
  {
    label: "Stories",
    description: "Learn through stories",
    href: "/stories",
    icon: "BookOpen01Icon",
  },
  {
    label: "Pronunciation",
    description: "Improve your pronunciation",
    href: "/pronunciation",
    icon: "Mic01Icon",
  },
  {
    label: "Lessons",
    description: "Browse subject lessons",
    href: "/lessons",
    icon: "BookOpen01Icon",
  },
];

export default function LearnPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pb-24">
      <AmbientGradient variant="study" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6">
        <CategoryOverview title="Learn" items={items} />
      </PageContainer>
    </div>
  );
}
