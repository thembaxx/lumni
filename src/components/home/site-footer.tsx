"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { appConfig } from "../../../app.config";

export function SiteFooter() {
  const t = useTranslations("home");
  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <footer className="border-t-2 border-foreground bg-[var(--surface)] py-16 text-foreground">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="font-display font-extrabold text-2xl tracking-tight text-foreground">
              Lumni
            </Link>
            <p className="mt-3 font-body text-sm leading-relaxed text-[var(--fg-muted)]">
              {t("footerDesc")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-2">
            <nav aria-label="Product Links" className="flex flex-col gap-4">
              <h3 className="font-body text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Product
              </h3>
              <div className="flex flex-col gap-2 font-body text-sm text-foreground">
                <Link href="/quiz" className="hover:underline">Quizzes</Link>
                <Link href="/past-papers" className="hover:underline">Past Papers</Link>
                <Link href="/flashcards" className="hover:underline">Flashcards</Link>
                <Link href="/study-plan" className="hover:underline">Planner</Link>
              </div>
            </nav>

            <nav aria-label="Support Links" className="flex flex-col gap-4">
              <h3 className="font-body text-xs font-bold uppercase tracking-wider text-[var(--fg-muted)]">
                Support
              </h3>
              <div className="flex flex-col gap-2 font-body text-sm text-foreground">
                <a href={`mailto:${appConfig.contact.supportEmail}`} className="hover:underline">
                  Support Email
                </a>
                <Link href="/privacy" className="hover:underline">Privacy Policy</Link>
                <Link href="/terms" className="hover:underline">Terms of Service</Link>
              </div>
            </nav>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[var(--border-soft)] pt-8 sm:flex-row">
          <p className="font-body text-xs text-[var(--fg-muted)]">
            &copy; {CURRENT_YEAR} Lumni. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
