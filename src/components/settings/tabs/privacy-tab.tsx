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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConsent } from "@/lib/consent/consent-context";
import { appConfig } from "../../../../app.config";

async function exportUserData(): Promise<void> {
	const res = await fetch("/api/user/export");
	if (!res.ok) return;
	const blob = await res.blob();
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `lumni-data-${new Date().toISOString().split("T")[0]}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export function PrivacyTab() {
	const t = useTranslations();
	const { consent, updateConsent } = useConsent();
	const [showDeleteDialog, setShowDeleteDialog] = useState(false);
	const [deleting, setDeleting] = useState(false);

	if (!consent) {
		return (
			<Card className="p-6">
				<p className="text-muted-foreground">
					{t("consent.privacyTab.noConsent")}
				</p>
			</Card>
		);
	}

	const handleDeleteAccount = async () => {
		setDeleting(true);
		try {
			const res = await fetch("/api/user/account", { method: "DELETE" });
			if (res.ok) {
				window.location.href = "/";
			}
		} finally {
			setDeleting(false);
			setShowDeleteDialog(false);
		}
	};

	const handleExport = exportUserData;

	return (
		<div className="flex flex-col gap-6">
			<Card className="p-6">
				<h3 className="ios-title-3 mb-4 font-semibold">
					{t("consent.privacyTab.consentPreferences")}
				</h3>
				<div className="flex flex-col gap-4">
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="privacy-analytics" className="font-medium">
								{t("consent.privacyTab.analytics")}
							</Label>
							<p className="text-muted-foreground text-sm">
								{t("consent.privacyTab.analyticsDesc")}
							</p>
						</div>
						<Switch
							id="privacy-analytics"
							checked={consent.analytics}
							onCheckedChange={(v) => updateConsent({ analytics: v })}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="privacy-marketing" className="font-medium">
								{t("consent.privacyTab.marketing")}
							</Label>
							<p className="text-muted-foreground text-sm">
								{t("consent.privacyTab.marketingDesc")}
							</p>
						</div>
						<Switch
							id="privacy-marketing"
							checked={consent.marketing}
							onCheckedChange={(v) => updateConsent({ marketing: v })}
						/>
					</div>
					<div className="flex items-center justify-between">
						<div>
							<Label htmlFor="privacy-data-sharing" className="font-medium">
								{t("consent.privacyTab.dataSharing")}
							</Label>
							<p className="text-muted-foreground text-sm">
								{t("consent.privacyTab.dataSharingDesc")}
							</p>
						</div>
						<Switch
							id="privacy-data-sharing"
							checked={consent.dataSharing}
							onCheckedChange={(v) => updateConsent({ dataSharing: v })}
						/>
					</div>
				</div>
			</Card>

			<Card className="p-6">
				<h3 className="ios-title-3 mb-4 font-semibold">
					{t("consent.privacyTab.policyVersions")}
				</h3>
				<div className="flex flex-col gap-2 text-sm">
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							{t("consent.privacyTab.termsOfService")}
						</span>
						<span>
							{consent.tosVersion ?? t("consent.privacyTab.notAccepted")} /{" "}
							{t("consent.privacyTab.currentLabel")}:{" "}
							{appConfig.legal.tosVersion}
						</span>
					</div>
					<div className="flex justify-between">
						<span className="text-muted-foreground">
							{t("consent.privacyTab.privacyPolicy")}
						</span>
						<span>
							{consent.privacyVersion ??
								t("consent.privacyTab.notAcknowledged")}{" "}
							/ {t("consent.privacyTab.currentLabel")}:{" "}
							{appConfig.legal.privacyVersion}
						</span>
					</div>
				</div>
			</Card>

			<Card className="p-6">
				<h3 className="ios-title-3 mb-4 font-semibold">
					{t("consent.privacyTab.yourData")}
				</h3>
				<div className="flex flex-col gap-3">
					<Button variant="secondary" onClick={handleExport}>
						{t("consent.privacyTab.exportData")}
					</Button>
					<Button
						variant="outline"
						className="border-destructive/30 text-destructive hover:bg-destructive/10"
						onClick={() => setShowDeleteDialog(true)}
					>
						{t("consent.privacyTab.deleteAccount")}
					</Button>
				</div>
			</Card>

			<Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>{t("consent.privacyTab.deleteTitle")}</DialogTitle>
						<DialogDescription>
							{t("consent.privacyTab.deleteDescription")}
						</DialogDescription>
					</DialogHeader>
					<div className="flex gap-3">
						<Button
							variant="outline"
							className="flex-1"
							onClick={() => setShowDeleteDialog(false)}
						>
							{t("consent.privacyTab.cancel")}
						</Button>
						<Button
							variant="destructive"
							className="flex-1"
							disabled={deleting}
							onClick={handleDeleteAccount}
						>
							{deleting
								? t("consent.privacyTab.deleting")
								: t("consent.privacyTab.deletePermanently")}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
