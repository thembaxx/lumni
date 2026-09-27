"use client";

import Menu01Icon from "@hugeicons/core-free-icons/Menu01Icon";
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FlagBar } from "@/components/ui/flag-bar";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export function Nav() {
  const { user, status, authReady } = useAuth();
  const isAuthenticated =
    authReady && status === "authenticated" && !user?.labels?.includes("anonymous");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-header w-full bg-background border-b-2 border-foreground">
      <FlagBar height={8} />
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Link
          href="/"
          className="font-display font-extrabold text-2xl tracking-tight text-foreground"
        >
          Lumni
        </Link>

        {/* Desktop Nav Links */}
        <nav className="hidden items-center gap-8 md:flex">
          <Link
            href="/quiz"
            className="font-body text-sm font-semibold text-[var(--fg-muted)] hover:text-foreground transition-colors"
          >
            Subjects
          </Link>
          <Link
            href="/past-papers"
            className="font-body text-sm font-semibold text-[var(--fg-muted)] hover:text-foreground transition-colors"
          >
            Past Papers
          </Link>
          <Link
            href="/study-plan"
            className="font-body text-sm font-semibold text-[var(--fg-muted)] hover:text-foreground transition-colors"
          >
            Planner
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <div className="hidden sm:block">
            {isAuthenticated ? (
              <Button asChild variant="primary" size="default">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="primary" size="default">
                <Link href="/dashboard">Get started</Link>
              </Button>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex size-10 items-center justify-center rounded border-2 border-foreground p-1.5 md:hidden"
            aria-label="Toggle Navigation Menu"
          >
            <HugeiconsIcon
              icon={mobileMenuOpen ? Cancel01Icon : Menu01Icon}
              className="size-6 text-foreground"
            />
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="border-t-2 border-foreground bg-[var(--surface)] p-4 md:hidden flex flex-col gap-3">
          <Link
            href="/quiz"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body font-semibold text-sm text-foreground"
          >
            Subjects
          </Link>
          <Link
            href="/past-papers"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body font-semibold text-sm text-foreground"
          >
            Past Papers
          </Link>
          <Link
            href="/study-plan"
            onClick={() => setMobileMenuOpen(false)}
            className="font-body font-semibold text-sm text-foreground"
          >
            Planner
          </Link>
          <Button asChild variant="primary" size="default" className="w-full mt-2">
            <Link href="/dashboard">Get started</Link>
          </Button>
        </div>
      )}
    </header>
  );
}
