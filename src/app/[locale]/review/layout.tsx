import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review Mistakes - Lumni",
  description: "Review and learn from your mistakes",
};

export default function ReviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
