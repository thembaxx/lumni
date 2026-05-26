"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Link } from "@/i18n/navigation";
import { appConfig } from "../../../app.config";

export function SiteFooter() {
	const t = useTranslations();
	const [mounted, setMounted] = useState(false);
	useEffect(() => {
		setMounted(true);
	}, []);

	return (
		<footer className="border-border/50 border-t py-12">
			<div className="mx-auto max-w-6xl px-4">
				<div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
					<div>
						<Link
							href="/"
							className="py-1.5 font-extrabold text-lg tracking-tight"
						>
							{t("home.footerBrand")}
						</Link>
						<p className="mt-2 max-w-xs text-muted-foreground text-sm">
							{t("home.footerDesc")}
						</p>
					</div>
					<div>
						<h4 className="mb-3 font-semibold text-sm">
							{t("home.footerProduct")}
						</h4>
						<div className="flex flex-col text-muted-foreground text-sm">
							<Link
								href="/quiz"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerQuiz")}
							</Link>
							<Link
								href="/past-papers"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerPapers")}
							</Link>
							<Link
								href="/flashcards"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerFlashcards")}
							</Link>
							<Link
								href="/study-plan"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerPlan")}
							</Link>
							<Link
								href="/solve"
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerHomework")}
							</Link>
						</div>
					</div>
					<div>
						<h4 className="mb-3 font-semibold text-sm">
							{t("home.footerSupport")}
						</h4>
						<div className="flex flex-col text-muted-foreground text-sm">
							<a
								href={appConfig.links.support}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerHelp")}
							</a>
							<a
								href={`mailto:${appConfig.contact.supportEmail}`}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerEmail")}
							</a>
							<Link
								href={appConfig.links.privacy}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerPrivacy")}
							</Link>
							<Link
								href={appConfig.links.terms}
								className="py-1.5 transition-colors hover:text-foreground"
							>
								{t("home.footerTerms")}
							</Link>
						</div>
					</div>
				</div>
				<div className="mt-8 flex flex-col items-center justify-between gap-4 border-border/50 border-t pt-8 sm:flex-row">
					<p className="text-muted-foreground text-xs">
						&copy; {mounted ? new Date().getFullYear() : ""} Lumni. All rights
						reserved.
					</p>
					<div className="flex items-center gap-4">
						<a
							href={`mailto:${appConfig.contact.email}`}
							className="py-1.5 text-muted-foreground transition-colors hover:text-foreground"
						>
							<span className="text-xs">{t("home.footerContact")}</span>
						</a>
					</div>
				</div>
			</div>
		</footer>
	);
}
