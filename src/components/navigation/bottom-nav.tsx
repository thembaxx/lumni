"use client";

import GridIcon from "@hugeicons/core-free-icons/GridIcon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { memo, Suspense, useMemo } from "react";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { SnapFab } from "@/components/tools/core/snap-fab";
import { Badge } from "@/components/ui/badge";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { springPresets } from "@/lib/utils/spring-presets";
import { useDataPrefetch } from "@/hooks/use-data-prefetch";
import { usePathname, Link } from "@/i18n/navigation";
import type { NavItem as ConfigNavItem } from "@/lib/navigation/config";
import { getPrimaryItems } from "@/lib/navigation/config";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { cn } from "@/lib/utils";

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
  "relative m-0 flex h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent px-3 text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent focus-visible:ring-inset";

function ItemContent({ item, isActive }: { item: BottomNavItem; isActive: boolean }) {
  return (
    <>
      <div className="relative flex size-6 items-center justify-center">
        {isActive && (
          <span className="absolute inset-0 rounded-full bg-system-accent/15 animate-float-bob" />
        )}
        <HugeiconsIcon
          icon={item.icon}
          className={cn(
            "size-5 transition-[transform,color] duration-200 ease-ios",
            isActive && "scale-125",
            isActive ? "text-system-accent" : "text-system-text-tertiary",
          )}
        />
        {isActive && (
          <span className="absolute -bottom-[3px] left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-system-accent" />
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <Badge
            variant="destructive"
            className="ios-caption-3 absolute -top-1 -right-1.5 h-4 min-w-4 border-0 px-1 leading-none tabular-nums"
          >
            {item.badge > 99 ? "99+" : item.badge}
          </Badge>
        )}
      </div>
      <span
        className={cn(
          "ios-caption-3 relative z-elevated text-center font-semibold leading-none transition-colors duration-200",
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
  onPrefetch,
}: {
  item: BottomNavItem;
  isActive: boolean;
  onPrefetch?: (href: string) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;
  const tapScale = shouldAnimate ? { scale: 0.96 } : undefined;
  const springTransition = springPresets.fast;

  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={() => onPrefetch?.(item.href)}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className={baseItemClass}
    >
      <m.span whileTap={tapScale} transition={springTransition}>
        <ItemContent item={item} isActive={isActive} />
      </m.span>
    </Link>
  );
});

const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const { push: navigate } = useNavigationDirection();
  const { isImmersive } = useImmersiveMode();

  const isAuthPage = pathname.startsWith("/auth");
  const isLanding = pathname === "/";
  const isHidden = isAuthPage || isLanding || isImmersive;

  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = !prefersReducedMotion;

  const prefetch = useDataPrefetch();

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
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="pointer-events-none fixed right-0 bottom-0 left-0 z-header md:hidden"
      style={{
        height: "calc(64px + env(safe-area-inset-bottom, 0px))",
        touchAction: "manipulation",
      }}
    >
      <div className="pointer-events-auto mx-auto flex h-full max-w-md items-end justify-center px-4 pb-4">
        <div className="flex items-center gap-2">
          <div className="glass-regular relative flex items-center rounded-full px-3 py-1 shadow-level-2 ring-1 ring-system-separator/30 before:pointer-events-none before:absolute before:inset-0 before:rounded-full before:bg-(--system-accent-alpha-10)">
            {navItems.map((item, index) => (
              <NavItemComponent
                key={item.id}
                item={item}
                isActive={index === activeIndex}
                onPrefetch={prefetch}
              />
            ))}
          </div>

          <Suspense fallback={null}>
            <SnapFab inline />
          </Suspense>

          <m.button
            type="button"
            onClick={() => navigate("/tools")}
            aria-label="All tools"
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.96 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 26, bounce: 0 }}
            className="flex size-12 shrink-0 items-center justify-center rounded-full bg-system-accent text-system-accent-foreground shadow-level-3 hover:bg-system-accent/90 press-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent focus-visible:ring-inset"
          >
            <HugeiconsIcon icon={GridIcon} className="size-5" />
          </m.button>
        </div>
      </div>
    </nav>
  );
});
export { BottomNav };
export default BottomNav;
