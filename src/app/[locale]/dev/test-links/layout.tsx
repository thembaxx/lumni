import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Test Links - Lumni",
  description: "Developer test links",
};

export default function TestLinksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
