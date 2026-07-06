import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryOverview } from "@/components/navigation/category-overview";

export const metadata: Metadata = {
  title: "Tools - Lumni",
};

const items = [
  { label: "Chat", description: "AI tutor chat assistant", href: "/chat", icon: "Chat01Icon" },
  {
    label: "Solve",
    description: "Step-by-step problem solver",
    href: "/solve",
    icon: "CompassIcon",
  },
  {
    label: "Study Guide",
    description: "Generate AI study guides",
    href: "/study-guide",
    icon: "BookOpen01Icon",
  },
  {
    label: "Periodic Table",
    description: "Interactive periodic table of elements",
    href: "/tools/periodic",
    icon: "Atom01Icon",
  },
  {
    label: "Calculator",
    description: "Scientific calculator",
    href: "/tools/calculator",
    icon: "CalculatorIcon",
  },
  {
    label: "APS Calculator",
    description: "Calculate your APS score",
    href: "/tools/aps",
    icon: "CalculateIcon",
  },
  {
    label: "Dictionary",
    description: "Look up word definitions",
    href: "/dictionary",
    icon: "Search01Icon",
  },
  {
    label: "Results",
    description: "Search past exam results",
    href: "/tools/results",
    icon: "Award01Icon",
  },
  {
    label: "Scheduler",
    description: "Plan your study schedule",
    href: "/tools/scheduler",
    icon: "Calendar01Icon",
  },
  {
    label: "Notes",
    description: "Create and manage study notes",
    href: "/tools/notes",
    icon: "Note01Icon",
  },
  {
    label: "Study Sets",
    description: "Create flashcard study sets",
    href: "/tools/study-sets",
    icon: "BookOpen02Icon",
  },
  {
    label: "Search",
    description: "Search all your content",
    href: "/search",
    icon: "Search01Icon",
  },
  {
    label: "Upload",
    description: "Upload files and documents",
    href: "/upload",
    icon: "Upload01Icon",
  },
  {
    label: "Referral",
    description: "Invite friends and earn rewards",
    href: "/settings/referral",
    icon: "Share07Icon",
  },
];

export default function ToolsPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped">
      <AmbientGradient variant="default" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6">
        <CategoryOverview title="Tools" items={items} />
      </PageContainer>
    </div>
  );
}
