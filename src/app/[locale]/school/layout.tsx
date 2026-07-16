import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "School - Lumni",
  description: "Manage your school licensing and team",
};

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  return children;
}
