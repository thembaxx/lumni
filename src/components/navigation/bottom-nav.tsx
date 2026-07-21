"use client";

import Camera01Icon from "@hugeicons/core-free-icons/Camera01Icon";
import GridIcon from "@hugeicons/core-free-icons/GridIcon";
import Home01Icon from "@hugeicons/core-free-icons/Home01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { memo, Suspense, useMemo } from "react";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Badge } from "@/components/ui/badge";
import { springPresets } from "@/lib/utils/spring-presets";
import { useDataPrefetch } from "@/hooks/use-data-prefetch";
import { usePathname, Link } from "@/i18n/navigation";
import type { NavItem as ConfigNavItem } from "@/lib/navigation/config";
import { getPrimaryItems } from "@/lib/navigation/config";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
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

const navIconClass =
  "mx-1 flex size-11 shrink-0 items-center justify-center rounded-xl text-system-text-tertiary hover:text-system-accent hover:bg-system-accent/10 press-scale focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent focus-visible:ring-inset";

const springBounce = {
  type: "spring" as const,
  stiffness: 500,
  damping: 22,
  mass: 0.6,
  bounce: 0.15,
};

function ActiveGlow() {
  return (
    <motion.span
      layoutId="activeGlow"
      transition={springBounce}
      className="absolute inset-0 rounded-full bg-system-accent/12"
      style={{ originX: 0.5, originY: 0.5 }}
    />
  );
}

function ActiveDot() {
  return (
    <motion.span
      layoutId="activeDot"
      transition={springBounce}
      className="absolute -bottom-[3px] left-1/2 h-[3px] w-4 -translate-x-1/2 rounded-full bg-system-accent"
    />
  );
}

function ItemContent({ item, isActive }: { item: BottomNavItem; isActive: boolean }) {
  return (
    <span className="relative flex flex-col items-center gap-0.5">
      <span className="relative flex size-6 items-center justify-center">
        {isActive && <ActiveGlow />}
        <motion.span
          animate={
            isActive
              ? { scale: 1.25, color: "var(--system-accent)" }
              : { scale: 1, color: "var(--system-text-tertiary)" }
          }
          transition={isActive ? springBounce : { duration: 0.2, ease: "easeOut" }}
          className="relative flex items-center justify-center"
        >
          <HugeiconsIcon icon={item.icon} className="size-5" />
        </motion.span>
        <AnimatePresence>{isActive && <ActiveDot />}</AnimatePresence>
        {item.badge !== undefined && item.badge > 0 && (
          <Badge
            variant="destructive"
            className="ios-caption-3 absolute -top-1 -right-1.5 h-4 min-w-4 border-0 px-1 leading-none tabular-nums"
          >
            {item.badge > 99 ? "99+" : item.badge}
          </Badge>
        )}
      </span>
      <motion.span
        animate={
          isActive
            ? { color: "var(--system-accent)", letterSpacing: "0.01em" }
            : { color: "var(--system-text-tertiary)", letterSpacing: "0em" }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="ios-caption-3 relative z-elevated text-center font-semibold leading-none"
      >
        {item.label}
      </motion.span>
    </span>
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
  const tapScale = shouldAnimate ? { scale: 0.94 } : undefined;

  return (
    <Link
      href={item.href}
      prefetch={true}
      onMouseEnter={() => onPrefetch?.(item.href)}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
      className="relative m-0 flex h-14 min-w-0 cursor-pointer flex-col items-center justify-center gap-0.5 border-none bg-transparent px-3 text-inherit no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-system-accent focus-visible:ring-inset"
    >
      <motion.span whileTap={tapScale} transition={springPresets.fast} className="contents">
        <ItemContent item={item} isActive={isActive} />
      </motion.span>
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
        height: "calc(var(--bottom-nav-height) + env(safe-area-inset-bottom, 0px))",
        touchAction: "manipulation",
      }}
    >
      <div className="pointer-events-auto mx-auto flex h-full max-w-md items-end justify-center px-4 pb-4">
        <div className="relative flex items-center rounded-2xl bg-system-background/75 shadow-level-3 ring-1 ring-system-separator/20 backdrop-blur-2xl before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-(--system-accent-alpha-10)">
          <Suspense fallback={null}>
            <SnapFabInline />
          </Suspense>

          <span className="h-6 w-px shrink-0 bg-system-separator/40" aria-hidden="true" />

          {navItems.map((item, index) => (
            <NavItemComponent
              key={item.id}
              item={item}
              isActive={index === activeIndex}
              onPrefetch={prefetch}
            />
          ))}

          <span className="h-6 w-px shrink-0 bg-system-separator/40" aria-hidden="true" />

          <motion.button
            type="button"
            onClick={() => navigate("/tools")}
            aria-label="All tools"
            whileHover={shouldAnimate ? { scale: 1.05 } : undefined}
            whileTap={shouldAnimate ? { scale: 0.94 } : undefined}
            transition={{ type: "spring", stiffness: 400, damping: 26, bounce: 0 }}
            className={navIconClass}
          >
            <HugeiconsIcon icon={GridIcon} className="size-5" />
          </motion.button>
        </div>
      </div>
    </nav>
  );
});

function SnapFabInline() {
  const pathname = usePathname();
  const { push } = useNavigationDirection();
  const isOnQuizOrFlashcards = pathname.startsWith("/quiz") || pathname.startsWith("/flashcards");
  const isOnExam = pathname.startsWith("/exam/");
  if (!isOnExam && !isOnQuizOrFlashcards) return null;
  return (
    <button
      type="button"
      onClick={() => push("/solve?camera=1")}
      aria-label="Snap photo to solve"
      className={navIconClass}
    >
      <HugeiconsIcon icon={Camera01Icon} className="size-5" data-icon />
    </button>
  );
}

export { BottomNav };
export default BottomNav;
