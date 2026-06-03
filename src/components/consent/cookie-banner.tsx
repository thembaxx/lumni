"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/lib/consent/consent-context";

export function CookieBanner() {
	const t = useTranslations();
	const { consent, updateConsent } = useConsent();
	const [showSettings, setShowSettings] = useState(false);

	if (consent) return null;

	const handleAccept = (
		analytics: boolean,
		marketing: boolean,
		dataSharing: boolean,
	) => {
		updateConsent({ analytics, marketing, dataSharing });
	};

	return (
		<>
			<div className="fixed right-0 bottom-0 left-0 z-cookie-banner p-4">
				<Card className="mx-auto max-w-lg bg-system-surface p-6 shadow-level-3">
					<p className="ios-body mb-3 font-semibold text-foreground">
						{t("consent.cookieBanner.title")}
					</p>
					<p className="ios-callout mb-4 text-muted-foreground">
						{t("consent.cookieBanner.description")}
					</p>
					<div className="flex flex-wrap gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={() => handleAccept(false, false, false)}
						>
							{t("consent.cookieBanner.essentialOnly")}
						</Button>
						<Button
							variant="secondary"
							size="sm"
							onClick={() => handleAccept(true, false, false)}
						>
							{t("consent.cookieBanner.acceptAnalytics")}
						</Button>
						<Button size="sm" onClick={() => handleAccept(true, true, true)}>
							{t("consent.cookieBanner.acceptAll")}
						</Button>
					</div>
					<button
						type="button"
						onClick={() => setShowSettings(true)}
						className="mt-3 text-sm text-system-accent underline"
					>
						{t("consent.cookieBanner.cookieSettings")}
					</button>
				</Card>
			</div>

			<Dialog open={showSettings} onOpenChange={setShowSettings}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("consent.cookieSettings.title")}</DialogTitle>
						<DialogDescription>
							{t("consent.cookieSettings.description")}
						</DialogDescription>
					</DialogHeader>
					<CookieSettingsContent onSave={handleAccept} />
				</DialogContent>
			</Dialog>
		</>
	);
}

function CookieSettingsContent({
	onSave,
}: {
	onSave: (
		analytics: boolean,
		marketing: boolean,
		dataSharing: boolean,
	) => void;
}) {
	const t = useTranslations();
	const [analytics, setAnalytics] = useState(false);
	const [marketing, setMarketing] = useState(false);
	const [dataSharing, setDataSharing] = useState(false);

	return (
		<div className="flex flex-col gap-4">
			<Field>
				<FieldLabel htmlFor="cookie-essential">
					{t("consent.cookieSettings.essential")}
				</FieldLabel>
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{t("consent.cookieSettings.essentialDesc")}
					</p>
					<div className="flex items-center gap-2">
						<div className="size-4 rounded-full bg-muted-foreground/30">
							<div className="ml-auto size-4 rounded-full bg-success" />
						</div>
						<span className="sr-only">Essential cookies always enabled</span>
					</div>
				</div>
			</Field>
			<Field>
				<FieldLabel htmlFor="cookie-analytics">
					{t("consent.cookieSettings.analytics")}
				</FieldLabel>
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{t("consent.cookieSettings.analyticsDesc")}
					</p>
					<Switch
						id="cookie-analytics"
						checked={analytics}
						onCheckedChange={setAnalytics}
					/>
				</div>
			</Field>
			<Field>
				<FieldLabel htmlFor="cookie-marketing">
					{t("consent.cookieSettings.marketing")}
				</FieldLabel>
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{t("consent.cookieSettings.marketingDesc")}
					</p>
					<Switch
						id="cookie-marketing"
						checked={marketing}
						onCheckedChange={setMarketing}
					/>
				</div>
			</Field>
			<Field>
				<FieldLabel htmlFor="cookie-data-sharing">
					{t("consent.cookieSettings.dataSharing")}
				</FieldLabel>
				<div className="flex items-center justify-between">
					<p className="text-muted-foreground text-sm">
						{t("consent.cookieSettings.dataSharingDesc")}
					</p>
					<Switch
						id="cookie-data-sharing"
						checked={dataSharing}
						onCheckedChange={setDataSharing}
					/>
				</div>
			</Field>
			<Button
				onClick={() => onSave(analytics, marketing, dataSharing)}
				className="mt-2"
			>
				{t("consent.cookieSettings.savePreferences")}
			</Button>
		</div>
	);
}
