"use client";

import ArrowLeftIcon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import Chat01Icon from "@hugeicons/core-free-icons/Chat01Icon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import Bell from "@hugeicons/core-free-icons/Notification01Icon";
import PaintBrushIcon from "@hugeicons/core-free-icons/PaintBrush01Icon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import ShieldCheck from "@hugeicons/core-free-icons/SecurityCheckIcon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Activity, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import {
  AppearanceTab,
  BetaTab,
  DataTab,
  NotificationsTab,
  PrivacyTab,
  ProfileTab,
  ReferralTab,
  StudyTab,
} from "@/components/settings/tabs";
import { ConfirmDialog } from "@/components/settings/tabs/sections/confirm-dialog";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { dexieDataAccess } from "@/lib/db/dexie-data-access";
import {
  loadSettings,
  saveSettings,
  clearSettings,
  type HydratedSettings,
} from "@/lib/db/settings-migrator";
import { initializeNotificationSchedulers } from "@/lib/services/notification-service";
import type { BetaFeatures, NotificationSettings, StudyPreferences } from "@/lib/utils/storage";

const tabDefs = [
  { value: "profile", key: "settings.account", icon: UserIcon },
  { value: "appearance", key: "settings.appearance", icon: PaintBrushIcon },
  { value: "study", key: "nav.studyPlanner", icon: BookOpen01Icon },
  { value: "notifications", key: "settings.notifications", icon: Bell },
  { value: "privacy", key: "settings.privacy", icon: ShieldCheck },
  { value: "referrals", key: "settings.referral", icon: Share07Icon },
  { value: "data", key: "settings.data", icon: DatabaseIcon },
  { value: "beta", key: "settings.beta", icon: Chat01Icon },
];

function SettingsContent() {
  const t = useTranslations();
  const { user, isAnonymous } = useAuth();
  const isLoggedIn = !!user && !isAnonymous;
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (isLoggedIn) {
      initializeNotificationSchedulers();
    }
  }, [isLoggedIn]);
  const [isSaving, setIsSaving] = useState(false);

  const visibleTabs = useMemo(
    () =>
      tabDefs.flatMap((td) =>
        td.value !== "referrals" || isLoggedIn ? [{ ...td, label: t(td.key) }] : [],
      ),
    [isLoggedIn, t],
  );
  const [saved, setSaved] = useState(false);

  const [appSettings, setAppSettings] = useState<HydratedSettings>({
    studyPrefs: null as unknown as StudyPreferences,
    notifications: null as unknown as NotificationSettings,
    betaFeatures: null as unknown as BetaFeatures,
  });
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    if (!user?.$id) return;
    loadSettings(dexieDataAccess, user.$id).then((settings) => {
      setAppSettings(settings);
      setSettingsLoaded(true);
    });
  }, [user?.$id]);

  if (!settingsLoaded || !appSettings.studyPrefs) {
    return <SettingsLoading />;
  }

  const { studyPrefs, notifications, betaFeatures } = appSettings;

  const setStudyPrefs = useCallback(
    (prefs: StudyPreferences) => setAppSettings((prev) => ({ ...prev, studyPrefs: prefs })),
    [],
  );

  const setNotifications = useCallback(
    (notif: NotificationSettings) => setAppSettings((prev) => ({ ...prev, notifications: notif })),
    [],
  );

  const handleSetActiveTab = useCallback(
    (tab: string) => {
      if (!isLoggedIn && tab === "referrals") {
        setActiveTab("profile");
      } else {
        setActiveTab(tab);
      }
    },
    [isLoggedIn],
  );

  const setBetaFeatures = useCallback(
    (beta: BetaFeatures) => setAppSettings((prev) => ({ ...prev, betaFeatures: beta })),
    [],
  );

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = async () => {
    if (!user?.$id) return;
    setIsSaving(true);
    setSaved(false);
    await saveSettings(dexieDataAccess, user.$id, { studyPrefs, notifications, betaFeatures });
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleExportData = () => {
    const data = {
      studyPreferences: studyPrefs,
      notificationSettings: notifications,
      betaFeatures: betaFeatures,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumni-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearCache = () => {
    setShowClearConfirm(true);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-system-grouped antialiased">
      <PageContainer className="flex-1">
        {/* Refined Header */}
        <header className="sticky top-0 z-header bg-system-grouped/90 px-6 pt-6 pb-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                aria-label={t("settings.backToDashboard")}
                className="flex size-10 items-center justify-center rounded-full border border-border/40 bg-system-surface text-foreground shadow-sm transition-colors hover:bg-secondary active:scale-[0.96]"
              >
                <HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
              </Link>
              <h1 className="ios-title-3 font-semibold text-foreground tracking-tight">
                {t("settings.title")}
              </h1>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-10 rounded-full bg-system-accent px-6 font-extrabold text-system-background-elevated shadow-level-2 transition-[transform,opacity] hover:bg-system-accent/90 active:scale-[0.96]"
            >
              {saved ? `✓ ${t("common.success")}` : isSaving ? t("common.saving") : "Save Settings"}
            </Button>
          </div>
        </header>

        {/* Tabs Navigation - Elevated Horizontal Scroll */}
        <nav className="sticky top-[calc(var(--spacing-safe-pt)+56px)] z-sticky border-border/5 border-b bg-system-grouped/90 px-6 py-2">
          <div className="scrollbar-hide -mx-2 flex gap-0 overflow-x-auto px-2 py-1" role="tablist">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  type="button"
                  role="tab"
                  id={`tab-${tab.value}`}
                  aria-selected={isActive}
                  aria-controls={`tabpanel-${tab.value}`}
                  onClick={() => handleSetActiveTab(tab.value)}
                  className={`relative flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 transition-colors duration-300 active:scale-[0.96]${
                    isActive
                      ? "border border-border/30 bg-system-surface text-system-accent shadow-level-1"
                      : "text-(--system-text-secondary) hover:bg-system-surface/50 hover:text-foreground"
                  }
									`}
                >
                  <span
                    className={`text-(length:--fs-footnote) font-extrabold ${isActive ? "opacity-100" : "opacity-80"}`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Content Area */}
        <main className="flex-1 p-6 pb-24">
          <Activity mode={activeTab === "profile" ? "visible" : "hidden"}>
            <div
              role="tabpanel"
              id="tabpanel-profile"
              aria-labelledby="tab-profile"
              className="w-full"
            >
              <ProfileTab />
            </div>
          </Activity>

          <Activity mode={activeTab === "appearance" ? "visible" : "hidden"}>
            <div
              role="tabpanel"
              id="tabpanel-appearance"
              aria-labelledby="tab-appearance"
              className="w-full"
            >
              <AppearanceTab />
            </div>
          </Activity>

          <Activity mode={activeTab === "study" ? "visible" : "hidden"}>
            <div role="tabpanel" id="tabpanel-study" aria-labelledby="tab-study" className="w-full">
              <StudyTab studyPrefs={studyPrefs} onStudyPrefsChange={setStudyPrefs} />
            </div>
          </Activity>

          <Activity mode={activeTab === "notifications" ? "visible" : "hidden"}>
            <div
              role="tabpanel"
              id="tabpanel-notifications"
              aria-labelledby="tab-notifications"
              className="w-full"
            >
              <NotificationsTab
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            </div>
          </Activity>

          <Activity mode={activeTab === "privacy" ? "visible" : "hidden"}>
            <div
              role="tabpanel"
              id="tabpanel-privacy"
              aria-labelledby="tab-privacy"
              className="w-full"
            >
              <PrivacyTab />
            </div>
          </Activity>

          <Activity mode={activeTab === "data" ? "visible" : "hidden"}>
            <div role="tabpanel" id="tabpanel-data" aria-labelledby="tab-data" className="w-full">
              <DataTab
                studyPrefs={studyPrefs}
                notifications={notifications}
                betaFeatures={betaFeatures}
                onExport={handleExportData}
                onClear={handleClearCache}
              />
            </div>
          </Activity>

          <Activity mode={activeTab === "referrals" && isLoggedIn ? "visible" : "hidden"}>
            <div
              role="tabpanel"
              id="tabpanel-referrals"
              aria-labelledby="tab-referrals"
              className="w-full"
            >
              {isLoggedIn && <ReferralTab />}
            </div>
          </Activity>

          <Activity mode={activeTab === "beta" ? "visible" : "hidden"}>
            <div role="tabpanel" id="tabpanel-beta" aria-labelledby="tab-beta" className="w-full">
              <BetaTab betaFeatures={betaFeatures} onBetaFeaturesChange={setBetaFeatures} />
            </div>
          </Activity>
        </main>
      </PageContainer>

      {showClearConfirm && (
        <ConfirmDialog
          open={showClearConfirm}
          title="Clear preferences?"
          description="This will reset your study preferences, notification settings, and beta feature preferences. Your account data and progress are not affected."
          confirmLabel="Clear preferences"
          cancelLabel="Keep them"
          onConfirm={() => {
            if (!user?.$id) return;
            clearSettings(dexieDataAccess, user.$id).then(() => {
              loadSettings(dexieDataAccess, user.$id).then(setAppSettings);
            });
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />
      )}
    </div>
  );
}

function SettingsLoading() {
  const t = useTranslations();
  return (
    <div className="flex min-h-dvh items-center justify-center bg-system-grouped">
      <div className="flex flex-col items-center gap-4">
        <HugeiconsIcon icon={RadialIcon} className="size-8 animate-spin text-muted-foreground" />
        <p className="ios-body text-(--system-text-secondary)">{t("common.loading")}</p>
      </div>
    </div>
  );
}

export function SettingsClient() {
  return (
    <AppErrorBoundary>
      <Suspense fallback={<SettingsLoading />}>
        <SettingsContent />
      </Suspense>
    </AppErrorBoundary>
  );
}
