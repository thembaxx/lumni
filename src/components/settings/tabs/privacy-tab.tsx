"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { Switch } from "@/components/ui/switch";
import { useNavigationDirection } from "@/hooks/use-navigation-direction";
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
  const { push } = useNavigationDirection();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!consent) {
    return (
      <div className="flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("consent.privacyTab.noConsent")}</p>
      </div>
    );
  }

  const handleDeleteAccount = () => {
    setDeleting(true);
    fetch("/api/user/account", { method: "DELETE" })
      .then((res) => {
        if (res.ok) push("/");
      })
      .finally(() => {
        setDeleting(false);
        setShowDeleteDialog(false);
      });
  };

  const handleExport = exportUserData;

  return (
    <div className="flex flex-col gap-2">
      <ListSection header={t("consent.privacyTab.consentPreferences")}>
        <ListCell
          title={t("consent.privacyTab.analytics")}
          subtitle={t("consent.privacyTab.analyticsDesc")}
          trailing={
            <Switch
              id="privacy-analytics"
              checked={consent.analytics}
              onCheckedChange={(v) => updateConsent({ analytics: v })}
            />
          }
        />
        <ListCell
          title={t("consent.privacyTab.marketing")}
          subtitle={t("consent.privacyTab.marketingDesc")}
          trailing={
            <Switch
              id="privacy-marketing"
              checked={consent.marketing}
              onCheckedChange={(v) => updateConsent({ marketing: v })}
            />
          }
        />
        <ListCell
          title={t("consent.privacyTab.dataSharing")}
          subtitle={t("consent.privacyTab.dataSharingDesc")}
          trailing={
            <Switch
              id="privacy-data-sharing"
              checked={consent.dataSharing}
              onCheckedChange={(v) => updateConsent({ dataSharing: v })}
            />
          }
        />
      </ListSection>

      <ListSection header={t("consent.privacyTab.policyVersions")}>
        <ListCell
          title={t("consent.privacyTab.termsOfService")}
          trailing={
            <span className="text-sm tabular-nums text-muted-foreground">
              {consent.tosVersion ?? t("consent.privacyTab.notAccepted")} /{" "}
              {t("consent.privacyTab.currentLabel")}: {appConfig.legal.tosVersion}
            </span>
          }
        />
        <ListCell
          title={t("consent.privacyTab.privacyPolicy")}
          trailing={
            <span className="text-sm tabular-nums text-muted-foreground">
              {consent.privacyVersion ?? t("consent.privacyTab.notAcknowledged")} /{" "}
              {t("consent.privacyTab.currentLabel")}: {appConfig.legal.privacyVersion}
            </span>
          }
        />
      </ListSection>

      <ListSection header={t("consent.privacyTab.yourData")}>
        <ListCell title={t("consent.privacyTab.exportData")} onClick={handleExport} />
        <ListCell
          title={t("consent.privacyTab.deleteAccount")}
          destructive
          onClick={() => setShowDeleteDialog(true)}
        />
      </ListSection>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("consent.privacyTab.deleteTitle")}</DialogTitle>
            <DialogDescription>{t("consent.privacyTab.deleteDescription")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
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
