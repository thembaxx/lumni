"use client";

import {
	ArrowLeftIcon,
	Bell,
	BookOpen01Icon,
	Chat01Icon,
	DatabaseIcon,
	PaintBrushIcon,
	RadialIcon,
	Share07Icon,
	ShieldCheck,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, m } from "framer-motion";
import { useTranslations } from "next-intl";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
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
import { AppErrorBoundary } from "@/components/shared/app-error-boundary";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { initializeNotificationSchedulers } from "@/lib/services/notification-service";
import { iOSEase } from "@/lib/utils/animation";
import {
	BETA_FEATURES_KEY,
	type BetaFeatures,
	DEFAULT_BETA,
	DEFAULT_NOTIFICATIONS,
	DEFAULT_PREFERENCES,
	loadFromStorage,
	NOTIFICATION_SETTINGS_KEY,
	type NotificationSettings,
	STUDY_PREFS_KEY,
	type StudyPreferences,
	saveToStorage,
} from "@/lib/utils/storage";

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
		initializeNotificationSchedulers();
	}, []);
	const [isSaving, setIsSaving] = useState(false);

	const visibleTabs = useMemo(
		() =>
			tabDefs.flatMap((td) =>
				td.value !== "referrals" || isLoggedIn
					? [{ ...td, label: t(td.key) }]
					: [],
			),
		[isLoggedIn, t],
	);
	const [saved, setSaved] = useState(false);

	type AppSettings = {
		studyPrefs: StudyPreferences;
		notifications: NotificationSettings;
		betaFeatures: BetaFeatures;
	};

	const [appSettings, setAppSettings] = useState<AppSettings>(() => {
		const onboarding = loadFromStorage<{
			selectedSubjects?: string[];
			targetAps?: number;
			dailyStudyMinutes?: number;
			notificationsEnabled?: boolean;
		}>("lumni_onboarding", {});

		const stored = loadFromStorage(STUDY_PREFS_KEY, DEFAULT_PREFERENCES);
		if (
			onboarding.dailyStudyMinutes &&
			!localStorage.getItem(STUDY_PREFS_KEY)
		) {
			stored.timerDuration = onboarding.dailyStudyMinutes * 60;
		}

		const notifPrefs = loadFromStorage(
			NOTIFICATION_SETTINGS_KEY,
			DEFAULT_NOTIFICATIONS,
		);
		if (
			onboarding.notificationsEnabled !== undefined &&
			!localStorage.getItem(NOTIFICATION_SETTINGS_KEY)
		) {
			notifPrefs.studyReminders = onboarding.notificationsEnabled;
			notifPrefs.streakAlerts = onboarding.notificationsEnabled;
		}

		const betaPrefs = loadFromStorage(BETA_FEATURES_KEY, DEFAULT_BETA);

		return {
			studyPrefs: stored,
			notifications: notifPrefs,
			betaFeatures: betaPrefs,
		};
	});

	const { studyPrefs, notifications, betaFeatures } = appSettings;

	const setStudyPrefs = useCallback(
		(prefs: StudyPreferences) =>
			setAppSettings((prev) => ({ ...prev, studyPrefs: prefs })),
		[],
	);

	const setNotifications = useCallback(
		(notif: NotificationSettings) =>
			setAppSettings((prev) => ({ ...prev, notifications: notif })),
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
		(beta: BetaFeatures) =>
			setAppSettings((prev) => ({ ...prev, betaFeatures: beta })),
		[],
	);

	const handleSave = async () => {
		setIsSaving(true);
		setSaved(false);
		saveToStorage(STUDY_PREFS_KEY, studyPrefs);
		saveToStorage(NOTIFICATION_SETTINGS_KEY, notifications);
		saveToStorage(BETA_FEATURES_KEY, betaFeatures);

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
		if (confirm("This will clear all your local preferences. Continue?")) {
			localStorage.removeItem(STUDY_PREFS_KEY);
			localStorage.removeItem(NOTIFICATION_SETTINGS_KEY);
			localStorage.removeItem(BETA_FEATURES_KEY);
			setAppSettings({
				studyPrefs: DEFAULT_PREFERENCES,
				notifications: DEFAULT_NOTIFICATIONS,
				betaFeatures: DEFAULT_BETA,
			});
		}
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
							{saved
								? `✓ ${t("common.success")}`
								: isSaving
									? t("common.saving")
									: t("common.save")}
						</Button>
					</div>
				</header>

				{/* Tabs Navigation - Elevated Horizontal Scroll */}
				<nav className="sticky top-[calc(var(--spacing-safe-pt)+56px)] z-sticky border-border/5 border-b bg-system-grouped/90 px-6 py-2">
					<div
						className="scrollbar-hide -mx-2 flex gap-0 overflow-x-auto px-2 py-1"
						role="tablist"
					>
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
											: "text-[--system-text-secondary] hover:bg-system-surface/50 hover:text-foreground"
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

				{/* Content Area - Rhythmic Spacing */}
				<main className="flex-1 p-6 pb-24">
					<AnimatePresence mode="wait" initial={false}>
						<m.div
							key={activeTab}
							role="tabpanel"
							id={`tabpanel-${activeTab}`}
							aria-labelledby={`tab-${activeTab}`}
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -10 }}
							transition={{
								type: "spring",
								duration: 0.4,
								bounce: 0,
								ease: iOSEase,
							}}
							className="w-full"
						>
							{activeTab === "profile" && <ProfileTab />}

							{activeTab === "appearance" && <AppearanceTab />}

							{activeTab === "study" && (
								<StudyTab
									studyPrefs={studyPrefs}
									onStudyPrefsChange={setStudyPrefs}
								/>
							)}

							{activeTab === "notifications" && (
								<NotificationsTab
									notifications={notifications}
									onNotificationsChange={setNotifications}
								/>
							)}

							{activeTab === "privacy" && <PrivacyTab />}

							{activeTab === "data" && (
								<DataTab
									studyPrefs={studyPrefs}
									notifications={notifications}
									betaFeatures={betaFeatures}
									onExport={handleExportData}
									onClear={handleClearCache}
								/>
							)}

							{activeTab === "referrals" && isLoggedIn && <ReferralTab />}

							{activeTab === "beta" && (
								<BetaTab
									betaFeatures={betaFeatures}
									onBetaFeaturesChange={setBetaFeatures}
								/>
							)}
						</m.div>
					</AnimatePresence>
				</main>
			</PageContainer>
		</div>
	);
}

function SettingsLoading() {
	const t = useTranslations();
	return (
		<div className="flex min-h-dvh items-center justify-center bg-system-grouped">
			<div className="flex flex-col items-center gap-4">
				<HugeiconsIcon
					icon={RadialIcon}
					className="size-8 animate-spin text-muted-foreground"
				/>
				<p className="ios-body text-[--system-text-secondary]">
					{t("common.loading")}
				</p>
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
