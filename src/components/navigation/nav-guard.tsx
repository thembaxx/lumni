"use client";

import { usePathname } from "@/i18n/navigation";

export function NavGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isOnboarding = pathname === "/onboarding";
  if (isOnboarding) return null;
  return children;
}
