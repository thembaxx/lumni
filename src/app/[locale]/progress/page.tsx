import type { Metadata } from "next";
import { AmbientGradient } from "@/components/shared/ambient-gradient";
import { NoiseOverlay } from "@/components/shared/noise-overlay";
import { PageContainer } from "@/components/layout/page-container";
import { CategoryOverview } from "@/components/navigation/category-overview";

export const metadata: Metadata = {
  title: "Progress - Lumni",
};

const items = [
  {
    label: "Study Plan",
    description: "Manage your study schedule",
    href: "/study-plan",
    icon: "Calendar01Icon",
  },
  {
    label: "Bookmarks",
    description: "View your saved bookmarks",
    href: "/bookmarks",
    icon: "Bookmark02Icon",
  },
  {
    label: "Settings",
    description: "Customise your app settings",
    href: "/settings",
    icon: "Settings01Icon",
  },
];

export default function ProgressPage() {
  return (
    <div className="relative min-h-dvh bg-system-grouped pb-24">
      <AmbientGradient variant="dashboard" />
      <NoiseOverlay opacity={0.015} />
      <PageContainer className="pt-6">
        <CategoryOverview title="Progress" items={items} />
      </PageContainer>
    </div>
  );
}

export const instant = false;
