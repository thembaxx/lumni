"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useConsent } from "@/lib/consent/consent-context";
import { appConfig } from "../../../app.config";

export function TosBanner() {
	const t = useTranslations();
	const { needsTosAcceptance, updateConsent } = useConsent();

	if (!needsTosAcceptance) return null;

	const handleAccept = () => {
		updateConsent({ tosVersion: appConfig.legal.tosVersion });
	};

	return (
		<div className="fixed top-0 right-0 left-0 z-cookie-banner px-4 pt-4">
			<Card className="mx-auto max-w-lg border-system-accent/20 bg-system-surface p-4 shadow-level-3">
				<p className="ios-body mb-2 font-semibold text-foreground">
					{t("consent.tosBanner.title")}
				</p>
				<p className="ios-callout mb-3 text-muted-foreground">
					{t("consent.tosBanner.description")}
				</p>
				<div className="flex gap-2">
					<Button size="sm" onClick={handleAccept}>
						{t("consent.tosBanner.accept")}
					</Button>
					<Button variant="outline" size="sm" asChild>
						<a
							href={appConfig.links.terms}
							target="_blank"
							rel="noopener noreferrer"
						>
							{t("consent.tosBanner.viewChanges")}
						</a>
					</Button>
				</div>
			</Card>
		</div>
	);
}
