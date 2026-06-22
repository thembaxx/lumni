import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { appConfig } from "../../../app.config";

export async function SiteFooter() {
  const t = await getTranslations("home");
  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <footer className="border-border/50 border-t py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <Link href="/" className="py-1.5 font-extrabold text-lg tracking-tight">
              {t("footerBrand")}
            </Link>
            <p className="mt-2 max-w-xs text-muted-foreground text-sm">{t("footerDesc")}</p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-sm">{t("footerProduct")}</h4>
            <div className="flex flex-col text-muted-foreground text-sm">
              <Link
                href="/quiz"
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerQuiz")}
              </Link>
              <Link
                href="/past-papers"
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerPapers")}
              </Link>
              <Link
                href="/flashcards"
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerFlashcards")}
              </Link>
              <Link
                href="/study-plan"
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerPlan")}
              </Link>
              <Link
                href="/solve"
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerHomework")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-sm">{t("footerSupport")}</h4>
            <div className="flex flex-col text-muted-foreground text-sm">
              <a
                href={appConfig.links.support}
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t("footerHelp")}
                <span className="sr-only">{t("opensInNewTab")}</span>
              </a>
              <a
                href={`mailto:${appConfig.contact.supportEmail}`}
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerEmail")}
              </a>
              <Link
                href={appConfig.links.privacy}
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerPrivacy")}
              </Link>
              <Link
                href={appConfig.links.terms}
                className="min-h-11 py-1.5 transition-colors hover:text-foreground"
              >
                {t("footerTerms")}
              </Link>
            </div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-border/50 border-t pt-8 sm:flex-row">
          <p className="text-muted-foreground text-xs">
            &copy; {CURRENT_YEAR} Lumni. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a
              href={`mailto:${appConfig.contact.email}`}
              className="min-h-11 py-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="text-xs">{t("footerContact")}</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
