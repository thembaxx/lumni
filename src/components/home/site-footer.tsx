import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { appConfig } from "../../../app.config";

export async function SiteFooter() {
  let t: (key: string) => string;
  try {
    t = await getTranslations("home");
  } catch {
    t = (key: string) => key;
  }
  const CURRENT_YEAR = new Date().getFullYear();

  return (
    <footer className="border-border/20 border-t py-16">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col gap-12 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <Link href="/" className="font-extrabold text-lg tracking-tight">
              {t("footerBrand")}
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t("footerDesc")}</p>
          </div>

          <div className="grid grid-cols-2 gap-10 md:grid-cols-3">
            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                {t("footerProduct")}
              </h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <Link
                  href="/quiz"
                  prefetch={true}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerQuiz")}
                </Link>
                <Link
                  href="/past-papers"
                  prefetch={true}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerPapers")}
                </Link>
                <Link
                  href="/flashcards"
                  prefetch={true}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerFlashcards")}
                </Link>
                <Link
                  href="/study-plan"
                  prefetch={true}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerPlan")}
                </Link>
                <Link
                  href="/solve"
                  prefetch={true}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerHomework")}
                </Link>
              </div>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
                {t("footerSupport")}
              </h4>
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                <a
                  href={appConfig.links.support}
                  className="transition-colors hover:text-foreground"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t("footerHelp")}
                  <span className="sr-only">{t("opensInNewTab")}</span>
                </a>
                <a
                  href={`mailto:${appConfig.contact.supportEmail}`}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerEmail")}
                </a>
                <Link
                  href={appConfig.links.privacy}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerPrivacy")}
                </Link>
                <Link
                  href={appConfig.links.terms}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerTerms")}
                </Link>
                <Link
                  href={appConfig.links.cookiePolicy}
                  className="transition-colors hover:text-foreground"
                >
                  {t("footerCookies")}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-border/20 border-t pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground/60">
            &copy; {CURRENT_YEAR} Lumni. All rights reserved.
          </p>
          <a
            href={`mailto:${appConfig.contact.email}`}
            className="text-xs text-muted-foreground/60 transition-colors hover:text-foreground"
          >
            {t("footerContact")}
          </a>
        </div>
      </div>
    </footer>
  );
}
