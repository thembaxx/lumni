"use client";

import Menu01Icon from "@hugeicons/core-free-icons/Menu01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useImmersiveMode } from "@/components/shared/immersive-mode";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
import { usePathname } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { type NavItem, navConfig } from "@/lib/navigation/config";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface SidebarState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SidebarStateContext = createContext<SidebarState>({
  open: false,
  setOpen: () => {},
});

export function SidebarStateProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo(() => ({ open, setOpen }), [open]);
  return <SidebarStateContext.Provider value={value}>{children}</SidebarStateContext.Provider>;
}

function SidebarContent() {
  const pathname = usePathname();
  const { push } = useNavigationDirection();
  const router = useRouter();
  const { user } = useAuth();
  const { setOpen } = use(SidebarStateContext);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const routes = [
      "/dashboard",
      "/learn",
      "/practice",
      "/tools",
      "/progress",
      "/quiz",
      "/flashcards",
      "/solve",
      "/search",
      "/study",
      "/exam-dates",
      "/review",
      "/study-plan",
      "/exam",
      "/past-papers",
      "/chat",
      "/study-guide",
      "/problems",
      "/stories",
      "/lessons",
      "/settings/referral",
    ];
    for (const route of routes) {
      router.prefetch(route);
    }
  }, [router]);

  const hasRole = useCallback(
    (role: string) => (user?.labels ?? []).includes(role),
    [user?.labels],
  );

  const filteredCategories = useMemo(() => {
    const q = query.toLowerCase().trim();
    return navConfig.flatMap((cat) => {
      if (cat.role && !hasRole(cat.role)) return [];

      const items = q
        ? cat.items.filter((item) => item.label.toLowerCase().includes(q))
        : cat.items;

      if (q && items.length === 0) return [];

      return [{ ...cat, items }];
    });
  }, [query, hasRole]);

  const activeRoute = useMemo(() => {
    for (const cat of navConfig) {
      for (const item of cat.items) {
        if (item.route === "/dashboard") {
          if (pathname === "/dashboard" || pathname === "/") return item.id;
        } else if (pathname.startsWith(item.route)) {
          return item.id;
        }
      }
    }
    return undefined;
  }, [pathname]);

  const handleNav = useCallback(
    (item: NavItem) => {
      setOpen(false);
      push(item.route);
    },
    [push, setOpen],
  );

  const noResults = query.trim() && filteredCategories.every((c) => c.items.length === 0);

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-border/30 border-b p-3">
        <div className="relative">
          <label htmlFor="sidebar-nav-search" className="sr-only">
            Search pages
          </label>
          <HugeiconsIcon
            icon={Menu01Icon}
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <input
            ref={searchRef}
            id="sidebar-nav-search"
            type="text"
            placeholder="Search pages..."
            aria-description="Cmd+K to focus"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-border/50 bg-system-fill pr-3 pl-9 text-base placeholder:text-muted-foreground/60 focus:border-system-accent focus:outline-none focus:ring-1 focus:ring-system-accent/30"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute top-1/2 right-2.5 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <span className="text-xs leading-none">×</span>
            </button>
          )}
        </div>
      </div>
      <ScrollArea className="flex-1 px-3 py-2">
        {filteredCategories.map((cat) => {
          const catRoute =
            cat.label === "Learn"
              ? "/learn"
              : cat.label === "Practice"
                ? "/practice"
                : cat.label === "Tools"
                  ? "/tools"
                  : cat.label === "Progress"
                    ? "/progress"
                    : undefined;
          return (
            <div key={cat.label} className="mb-3">
              {catRoute ? (
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    push(catRoute);
                  }}
                  className="ios-caption-3 flex w-full items-center justify-between px-2 py-1.5 font-semibold text-muted-foreground uppercase tracking-wider transition-colors hover:text-foreground"
                >
                  {cat.label}
                  <span className="text-[10px] opacity-40">→</span>
                </button>
              ) : (
                <div className="ios-caption-3 px-2 py-1.5 font-semibold text-muted-foreground uppercase tracking-wider">
                  {cat.label}
                </div>
              )}
              {cat.items.map((item) => {
                const isActive = item.id === activeRoute;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNav(item)}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "flex h-9 w-full cursor-pointer items-center gap-3 rounded-lg px-2 text-left text-sm transition-colors duration-150",
                      isActive
                        ? "bg-system-accent/10 font-semibold text-system-accent"
                        : "text-muted-foreground hover:bg-system-fill hover:text-foreground",
                    )}
                  >
                    <HugeiconsIcon
                      icon={Icon}
                      className={cn(
                        "size-5 shrink-0",
                        isActive ? "text-system-accent" : "text-muted-foreground/60",
                      )}
                    />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
        {noResults && (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <p className="text-muted-foreground text-sm">No pages found</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

export function SidebarNav() {
  const { isImmersive } = useImmersiveMode();
  const { open, setOpen } = use(SidebarStateContext);

  if (isImmersive) return null;

  return (
    <>
      <aside
        aria-label="Sidebar navigation"
        className="relative hidden h-dvh w-60 shrink-0 flex-col border-system-separator/50 border-r bg-system-grouped pt-safe before:pointer-events-none before:absolute before:inset-0 before:bg-(--system-accent-alpha-10) md:flex"
      >
        <SidebarContent />
      </aside>
      <div className="md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" showCloseButton={false} className="flex w-72 flex-col p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

export function SidebarHamburger() {
  const { open, setOpen } = use(SidebarStateContext);
  const { isImmersive } = useImmersiveMode();

  if (isImmersive) return null;

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={() => setOpen(!open)}
      aria-label="Toggle navigation sidebar"
      className="mr-1 flex md:hidden"
    >
      <HugeiconsIcon icon={Menu01Icon} className="size-5" />
    </Button>
  );
}
