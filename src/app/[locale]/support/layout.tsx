import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support - Lumni",
  description: "Get help and support for Lumni",
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return children;
}
