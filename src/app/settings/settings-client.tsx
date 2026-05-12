"use client";

import {
	AiChat02Icon,
	ArrowLeftIcon,
	Book02Icon,
	Database01Icon,
	Notification03Icon,
	PaintBrush01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
	AppearanceTab,
	BetaTab,
	DataTab,
	NotificationsTab,
	ProfileTab,
	StudyTab,
} from "@/components/settings/tabs";
import { Button } from "@/components/ui/button";
import { useAppwriteSession } from "@/hooks/use-appwrite-session";
import { account } from "@/lib/appwrite";
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

const tabs = [
	{ value: "profile", label: "Profile", icon: UserIcon },
	{ value: "appearance", label: "UI", icon: PaintBrush01Icon },
	{ value: "study", label: "Study", icon: Book02Icon },
	{ value: "notifications", label: "Alerts", icon: Notification03Icon },
	{ value: "data", label: "Data", icon: Database01Icon },
	{ value: "beta", label: "Beta", icon: AiChat02Icon },
];

function SettingsContent() {
	const router = useRouter();
	const { user } = useAppwriteSession();
	const [studyPrefs, setStudyPrefs] =
		useState<StudyPreferences>(DEFAULT_PREFERENCES);
	const [notifications, setNotifications] = useState<NotificationSettings>(
		DEFAULT_NOTIFICATIONS,
	);
	const [betaFeatures, setBetaFeatures] = useState<BetaFeatures>(DEFAULT_BETA);
	const [activeTab, setActiveTab] = useState("profile");
	const [isSaving, setIsSaving] = useState(false);

	useEffect(() => {
		setStudyPrefs(loadFromStorage(STUDY_PREFS_KEY, DEFAULT_PREFERENCES));
		setNotifications(
			loadFromStorage(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATIONS),
		);
		setBetaFeatures(loadFromStorage(BETA_FEATURES_KEY, DEFAULT_BETA));
	}, []);

	const handleSave = async () => {
		setIsSaving(true);
		saveToStorage(STUDY_PREFS_KEY, studyPrefs);
		saveToStorage(NOTIFICATION_SETTINGS_KEY, notifications);
		saveToStorage(BETA_FEATURES_KEY, betaFeatures);

		await new Promise((resolve) => setTimeout(resolve, 600));
		setIsSaving(false);
	};

	const handleSignOut = async () => {
		try {
			await account.deleteSession("current");
			router.push("/");
			router.refresh();
		} catch (error) {
			console.error("Sign out failed:", error);
		}
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
			setStudyPrefs(DEFAULT_PREFERENCES);
			setNotifications(DEFAULT_NOTIFICATIONS);
			setBetaFeatures(DEFAULT_BETA);
		}
	};

	return (
		<div className="min-h-screen bg-system-grouped flex flex-col antialiased">
			<div className="mx-auto w-full max-w-md flex flex-col flex-1">
				{/* Refined Header */}
				<header className="sticky top-0 z-30 bg-system-grouped/90 backdrop-blur-xl px-6 pt-safe pb-4">
					<div className="flex items-center justify-between h-14">
						<div className="flex items-center gap-4">
							<Link
								href="/dashboard"
								className="flex items-center justify-center size-10 rounded-full text-foreground bg-system-surface shadow-sm border border-border/40 hover:bg-secondary transition-colors active:scale-[0.96]"
							>
								<HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
							</Link>
							<h1 className="ios-title-3 text-foreground font-bold tracking-tight">
								Settings
							</h1>
						</div>

						<Button
							size="sm"
							onClick={handleSave}
							disabled={isSaving}
							className="h-10 px-6 rounded-full font-bold bg-system-accent hover:bg-system-accent/90 text-white shadow-level-2 transition-[transform,opacity] active:scale-[0.96]"
						>
							{isSaving ? "Saving..." : "Save"}
						</Button>
					</div>
				</header>

				{/* Tabs Navigation - Elevated Horizontal Scroll */}
				<nav className="sticky top-[calc(var(--spacing-safe-pt)+56px)] z-20 bg-system-grouped/90 backdrop-blur-xl px-6 py-2 border-b border-border/5">
					<div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 -mx-2 px-2">
						{tabs.map((tab) => {
							const isActive = activeTab === tab.value;
							return (
								<button
									key={tab.value}
									onClick={() => setActiveTab(tab.value)}
									className={`
										relative flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap transition-all duration-300 active:scale-[0.96]
										${
											isActive
												? "bg-system-surface text-system-accent shadow-level-1 border border-border/10"
												: "text-[--system-text-secondary] hover:text-foreground hover:bg-system-surface/50"
										}
									`}
								>
									<HugeiconsIcon
										icon={tab.icon}
										className={`size-4.5 transition-transform duration-300 ${isActive ? "scale-110" : ""}`}
									/>
									<span
										className={`text-[13px] font-bold tracking-wide ${isActive ? "opacity-100" : "opacity-80"}`}
									>
										{tab.label}
									</span>
								</button>
							);
						})}
					</div>
				</nav>

				{/* Content Area - Rhythmic Spacing */}
				<main className="flex-1 px-6 py-6 pb-24">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
							animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
							exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
							transition={{
								type: "spring",
								duration: 0.4,
								bounce: 0,
								ease: iOSEase,
							}}
							className="w-full"
						>
							{activeTab === "profile" && (
								<ProfileTab user={user} onSignOut={handleSignOut} />
							)}

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

							{activeTab === "data" && (
								<DataTab
									studyPrefs={studyPrefs}
									notifications={notifications}
									betaFeatures={betaFeatures}
									onExport={handleExportData}
									onClear={handleClearCache}
								/>
							)}

							{activeTab === "beta" && (
								<BetaTab
									betaFeatures={betaFeatures}
									onBetaFeaturesChange={setBetaFeatures}
								/>
							)}
						</motion.div>
					</AnimatePresence>
				</main>
			</div>
		</div>
	);
}

export function SettingsClient() {
	return (
		<Suspense
			fallback={
				<div className="flex items-center justify-center min-h-screen bg-system-grouped">
					<div className="p-8 text-center ios-body text-[--system-text-secondary] animate-pulse">
						Loading settings...
					</div>
				</div>
			}
		>
			<SettingsContent />
		</Suspense>
	);
}
