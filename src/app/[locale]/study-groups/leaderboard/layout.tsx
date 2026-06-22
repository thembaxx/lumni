import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Group Leaderboard - Lumni",
  description: "View weekly study group rankings and competition standings",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
