import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { LeaderboardClient } from "./leaderboard-client";

export const metadata: Metadata = {
  title: "Leaderboard - Lumni",
  description: "See how your XP and streaks compare to other students",
};

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <LeaderboardClient />
    </Suspense>
  );
}

export const instant = false;
