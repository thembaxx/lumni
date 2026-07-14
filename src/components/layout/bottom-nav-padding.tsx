"use client";

import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { usePathname } from "@/i18n/navigation";

export function BottomNavPadding() {
  const pathname = usePathname();
  const { isImmersive } = useImmersiveMode();

  const isAuthPage = pathname.startsWith("/auth");
  const isLanding = pathname === "/";

  if (isAuthPage || isLanding || isImmersive) return null;

  return (
    <div
      className="md:hidden"
      style={{ height: "calc(64px + env(safe-area-inset-bottom, 0px))" }}
    />
  );
}
