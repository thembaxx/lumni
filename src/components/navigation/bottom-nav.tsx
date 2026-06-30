"use client";

import GridIcon from "@hugeicons/core-free-icons/GridIcon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { SnapFab } from "@/components/tools/core/snap-fab";
import { ToolsDialog } from "@/components/tools/core/tools-dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { usePathname, Link } from "@/i18n/navigation";
import type { NavItem as ConfigNavItem } from "@/lib/navigation/config";
import { getPrimaryItems } from "@/lib/navigation/config";
import { cn } from "@/lib/utils";
import { useToolsStore } from "@/store/tools";

interface BottomNavItem {
  id: string;
  label: string;
  icon: ConfigNavItem["icon"];
  href: string;
  badge?: number;
}

const navItems: BottomNavItem[] = [
  {
    id: "home",
    label: "Home",
    icon: Home01Icon,
    href: "/dashboard",
  },
  ...getPrimaryItems().map((item) => ({
    id: item.id,
    label: item.label,
    icon: item.icon,
    href: item.route,
  })),
];

const baseItemClass =
  "relative m-0 flex h-11 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent px-3 text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--system-accent) focus-visible:ring-inset active:scale-[0.96] transition-transform duration-200 ease-ios";

function ItemContent({ item, isActive }: { item: BottomNavItem; isActive: boolean }) {
  return (
    <>
      <div className="relative mb-0.5 flex size-5 items-center justify-center">
        <HugeiconsIcon
          icon={item.icon}
          className={cn(
            "size-[18px] transition-[transform,color] duration-200 ease-ios",
            isActive && "scale-110",
            isActive ? "text-system-accent" : "text-system-text-tertiary",
          )}
        />
        {item.badge !== undefined && item.badge > 0 && (
          <Badge
            variant="destructive"
            className="ios-caption-3 absolute -top-1 -right-1.5 h-4 min-w-4 border-0 px-1 leading-none"
          >
            {item.badge > 99 ? "99+" : item.badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "ios-caption-3 relative z-elevated text-center font-medium uppercase leading-none tracking-(--tracking-caption-1) transition-colors duration-200",
          isActive ? "text-system-accent" : "text-system-text-tertiary",
        )}
      >
        {item.label}
      </span>
    </>
  );
}

const NavItemComponent = memo(function NavItemComponent({
  item,
  isActive,
  onNavigate,
}: {
  item: BottomNavItem;
  isActive: boolean;
  onNavigate?: (href: string) => void;
}) {
  if (item.href === "/chat") {
    return (
      <button
        type="button"
        onClick={() => onNavigate?.(item.href)}
        aria-label={item.label}
        aria-current={isActive ? "page" : undefined}
        className={baseItemClass}
      >
        <ItemContent item={item} isActive={isActive} />
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={baseItemClass}
    >
      <ItemContent item={item} isActive={isActive} />
    </Link>
  );
});

export function BottomNav() {
  const pathname = usePathname();
  const { push } = useNavigationDirection();
  const { isImmersive } = useImmersiveMode();
  const [toolsOpen, setToolsOpen] = useState(false);
  const storeOpen = useToolsStore((s) => s.open);
  const closeTools = useToolsStore((s) => s.closeTools);

  const isAuthPage = pathname.startsWith("/auth");
  const isLanding = pathname === "/";
  const isHidden = isAuthPage || isLanding || isImmersive;

  useEffect(() => {
    if (storeOpen) {
      setToolsOpen(true);
    }
  }, [storeOpen]);

  const handleToolsChange = useCallback(
    (open: boolean) => {
      setToolsOpen(open);
      if (!open) {
        closeTools();
      }
    },
    [closeTools],
  );

  const handleOpenTools = useCallback(() => {
    useToolsStore.getState().openTools();
    setToolsOpen(true);
  }, []);

  const handleNavigate = useCallback(
    (href: string) => {
      push(href);
    },
    [push],
  );

  const activeIndex = useMemo(() => {
    const index = navItems.findIndex((item) => {
      if (item.href === "/dashboard") {
        return pathname === "/dashboard" || pathname === "/";
      }
      return pathname.startsWith(item.href);
    });
    return index >= 0 ? index : 0;
  }, [pathname]);

  if (isHidden) return null;

  return (
    <>
      <div
        className="pointer-events-none fixed right-0 bottom-0 left-0 z-header md:hidden"
        style={{
          height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <div className="pointer-events-auto mx-auto flex h-full max-w-md items-end justify-center px-4 pb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex items-center rounded-full bg-system-background/80 px-1.5 py-1 shadow-level-2 ring-1 ring-system-separator/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-(--system-accent-alpha-10)">
              {navItems.map((item, index) => (
                <NavItemComponent
                  key={item.id}
                  item={item}
                  isActive={index === activeIndex}
                  onNavigate={item.href === "/chat" ? handleNavigate : undefined}
                />
              ))}
            </div>

            <Suspense fallback={null}>
              <SnapFab inline />
            </Suspense>

            <button
              type="button"
              onClick={handleOpenTools}
              aria-label="Open tools"
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-system-accent text-white shadow-level-3 transition-[scale,box-shadow] duration-150 active:scale-[0.96] hover:bg-system-accent/90"
            >
              <HugeiconsIcon icon={GridIcon} className="size-5" />
            </button>
          </div>
        </div>
      </div>

      <ToolsDialog open={toolsOpen} onOpenChange={handleToolsChange} />
    </>
  );
}
