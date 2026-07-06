import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryOverview } from "@/components/navigation/category-overview";

export const metadata: Metadata = {
  title: "Practice - Lumni",
};

const items = [
  { label: "Exams", description: "Take full exam simulations", href: "/exams", icon: "File01Icon" },
  {
    label: "Past Papers",
    description: "Browse past exam papers",
    href: "/past-papers",
    icon: "File01Icon",
  },
  {
    label: "Question Bank",
    description: "Browse past paper questions by topic",
    href: "/practice/questions",
    icon: "BookOpen01Icon",
  },
  {
    label: "Exam Dates",
    description: "View upcoming exam schedules",
    href: "/exam-dates",
    icon: "Calendar01Icon",
  },
  {
    label: "Review Mistakes",
    description: "Review and learn from mistakes",
    href: "/review",
    icon: "Target01Icon",
  },
];

export default function PracticePage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="quiz" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6">
        <CategoryOverview title="Practice" items={items} />
      </PageContainer>
    </div>
  );
}
