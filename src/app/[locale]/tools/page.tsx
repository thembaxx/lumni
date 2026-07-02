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
    label: "Dictionary",
    description: "Look up word definitions",
    href: "/dictionary",
    icon: "Search01Icon",
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
    <div className="relative min-h-dvh bg-system-grouped pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6">
        <CategoryOverview title="Tools" items={items} />
      </PageContainer>
    </div>
  );
}

export const instant = false;
