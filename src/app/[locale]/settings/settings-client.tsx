"use client";

import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon";
import BookOpen01Icon from "@hugeicons/core-free-icons/BookOpen01Icon";
import DatabaseIcon from "@hugeicons/core-free-icons/DatabaseIcon";
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon";
import PaintBrush01Icon from "@hugeicons/core-free-icons/PaintBrush01Icon";
import RadialIcon from "@hugeicons/core-free-icons/RadialIcon";
import SecurityCheckIcon from "@hugeicons/core-free-icons/SecurityCheckIcon";
import Share07Icon from "@hugeicons/core-free-icons/Share07Icon";
import SettingsIcon from "@hugeicons/core-free-icons/Settings01Icon";
import UserIcon from "@hugeicons/core-free-icons/UserIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { PageContainer } from "@/components/layout/page-container";
import {
  AppearanceTab,
  DataTab,
  NotificationsTab,
  PrivacyTab,
  ProfileTab,
  ReferralTab,
  StudyTab,
  SyncTab,
} from "@/components/settings/tabs";
import { ConfirmDialog } from "@/components/settings/tabs/sections/confirm-dialog";
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { SpotlightCard } from "@/components/shared/motion-primitives";
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
import { initializeNotificationSchedulers } from "@/lib/services";
import type { NotificationSettings, StudyPreferences } from "@/lib/utils/storage";
import { cn } from "@/lib/utils";

const tabDefs = [
  {
    value: "profile",
    key: "settings.account",
    icon: UserIcon,
    color: "from-primary/20 to-primary/5",
  },
  {
    value: "appearance",
    key: "settings.appearance",
    icon: PaintBrush01Icon,
    color: "from-chart-3/20 to-chart-3/5",
  },
  {
    value: "study",
    key: "nav.studyPlanner",
    icon: BookOpen01Icon,
    color: "from-chart-2/20 to-chart-2/5",
  },
  {
    value: "notifications",
    key: "settings.notifications",
    icon: Notification01Icon,
    color: "from-chart-4/20 to-chart-4/5",
  },
  {
    value: "privacy",
    key: "settings.privacy",
    icon: SecurityCheckIcon,
    color: "from-primary/20 to-transparent",
  },
  {
    value: "referrals",
    key: "settings.referral",
    icon: Share07Icon,
    color: "from-chart-3/20 to-chart-5/5",
  },
  {
    value: "data",
    key: "settings.data",
    icon: DatabaseIcon,
    color: "from-chart-4/20 to-chart-2/5",
  },
  {
    value: "sync",
    key: "settings.sync",
    icon: DatabaseIcon,
    color: "from-info/20 to-chart-5/5",
  },
];

function TabPanel({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  return (
    <AnimatePresence mode="wait">
      {isActive && (
        <m.div
          key="panel"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  );
}

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
  const [saved, setSaved] = useState(false);

  const visibleTabs = useMemo(
    () =>
      tabDefs.flatMap((td) =>
        td.value !== "referrals" || isLoggedIn ? [{ ...td, label: t(td.key) }] : [],
      ),
    [isLoggedIn, t],
  );

  const [appSettings, setAppSettings] = useState<HydratedSettings>({
    studyPrefs: null as unknown as StudyPreferences,
    notifications: null as unknown as NotificationSettings,
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

  const { studyPrefs, notifications } = appSettings;

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

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleSave = async () => {
    if (!user?.$id) return;
    setIsSaving(true);
    setSaved(false);
    await saveSettings(dexieDataAccess, user.$id, { studyPrefs, notifications });
    await new Promise((resolve) => setTimeout(resolve, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const handleExportData = () => {
    const data = {
      studyPreferences: studyPrefs,
      notificationSettings: notifications,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `lumni-settings-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-system-grouped antialiased">
      <PageContainer className="flex-1">
        <header className="sticky top-0 z-header bg-system-grouped/80 pt-4 pb-2 backdrop-blur-xl">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                aria-label={t("settings.backToDashboard")}
                className="flex min-h-11 min-w-11 size-10 items-center justify-center rounded-full border border-border/30 bg-system-surface text-foreground shadow-level-1 transition-[background-color,box-shadow,transform] duration-200 hover:bg-secondary hover:shadow-level-1 active:scale-[0.96]"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" />
              </Link>
              <div className="flex items-center gap-2.5">
                <div className="flex size-10 items-center justify-center rounded-xl bg-(--system-accent-alpha-10)">
                  <HugeiconsIcon icon={SettingsIcon} className="size-5 text-primary" />
                </div>
                <div>
                  <h1 className="ios-title-3 font-semibold text-foreground tracking-tight">
                    {t("settings.title")}
                  </h1>
                  <p className="ios-caption-1 text-muted-foreground">Customise your experience</p>
                </div>
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="h-11 rounded-full bg-system-accent px-5 font-bold text-system-background-elevated shadow-level-2 transition-[background-color,box-shadow,transform] duration-200 hover:bg-system-accent/90 hover:shadow-level-3 active:scale-[0.96]"
            >
              {saved ? "Saved!" : isSaving ? t("common.saving") : "Save"}
            </Button>
          </div>
        </header>

        <nav className="sticky top-28 z-sticky bg-system-grouped/80 py-3 backdrop-blur-xl">
          <div className="relative">
            <div className="scrollbar-hide flex gap-1.5 overflow-x-auto" role="tablist">
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
                    className={cn(
                      "relative flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-xs transition-[background-color,box-shadow,transform] duration-300 active:scale-[0.96]",
                      isActive
                        ? "bg-system-surface text-system-accent shadow-level-1"
                        : "text-muted-foreground hover:bg-system-surface/50 hover:text-foreground",
                    )}
                  >
                    <HugeiconsIcon
                      icon={tab.icon}
                      className={cn(
                        "size-4 transition-colors duration-300",
                        isActive && "text-primary",
                      )}
                    />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute top-0 right-0 bottom-0 w-10 bg-linear-to-l from-system-grouped to-transparent md:hidden" />
          </div>
        </nav>

        <SpotlightCard className="flex-1 pt-4 md:pb-6" radius={500}>
          <TabPanel isActive={activeTab === "profile"}>
            <div role="tabpanel" id="tabpanel-profile" aria-labelledby="tab-profile">
              <ProfileTab />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "appearance"}>
            <div role="tabpanel" id="tabpanel-appearance" aria-labelledby="tab-appearance">
              <AppearanceTab />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "study"}>
            <div role="tabpanel" id="tabpanel-study" aria-labelledby="tab-study">
              <StudyTab studyPrefs={studyPrefs} onStudyPrefsChange={setStudyPrefs} />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "notifications"}>
            <div role="tabpanel" id="tabpanel-notifications" aria-labelledby="tab-notifications">
              <NotificationsTab
                notifications={notifications}
                onNotificationsChange={setNotifications}
              />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "privacy"}>
            <div role="tabpanel" id="tabpanel-privacy" aria-labelledby="tab-privacy">
              <PrivacyTab />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "data"}>
            <div role="tabpanel" id="tabpanel-data" aria-labelledby="tab-data">
              <DataTab onExport={handleExportData} onClear={() => setShowClearConfirm(true)} />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "sync"}>
            <div role="tabpanel" id="tabpanel-sync" aria-labelledby="tab-sync">
              <SyncTab />
            </div>
          </TabPanel>

          <TabPanel isActive={activeTab === "referrals" && isLoggedIn}>
            <div role="tabpanel" id="tabpanel-referrals" aria-labelledby="tab-referrals">
              {isLoggedIn && <ReferralTab />}
            </div>
          </TabPanel>
        </SpotlightCard>
      </PageContainer>

      {showClearConfirm && (
        <ConfirmDialog
          open={showClearConfirm}
          title="Clear preferences?"
          description="This will reset your study preferences and notification settings. Your account data and progress are not affected."
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
        <p className="ios-body text-muted-foreground">{t("common.loading")}</p>
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
