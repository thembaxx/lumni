"use client";

import { ArrowLeftIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
	AppearanceTab,
	BetaTab,
	DataTab,
	StudyTab,
} from "@/components/settings/tabs";
import { SegmentedControl } from "@/components/ui/segmented-control";
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
	{ value: "appearance", label: "Appearance" },
	{ value: "study", label: "Study" },
	{ value: "data", label: "Data" },
	{ value: "beta", label: "Beta" },
];

const iOSEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

function SettingsContent() {
	const [studyPrefs, setStudyPrefs] =
		useState<StudyPreferences>(DEFAULT_PREFERENCES);
	const [notifications, setNotifications] = useState<NotificationSettings>(
		DEFAULT_NOTIFICATIONS,
	);
	const [betaFeatures, setBetaFeatures] = useState<BetaFeatures>(DEFAULT_BETA);
	const [activeTab, setActiveTab] = useState("appearance");

	useEffect(() => {
		setStudyPrefs(loadFromStorage(STUDY_PREFS_KEY, DEFAULT_PREFERENCES));
		setNotifications(
			loadFromStorage(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATIONS),
		);
		setBetaFeatures(loadFromStorage(BETA_FEATURES_KEY, DEFAULT_BETA));
	}, []);

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
		<div className="min-h-screen bg-[--system-grouped-background]">
			<div className="mx-auto max-w-md">
				<div className="flex items-center gap-3 px-4 pt-safe pb-2">
					<Link
						href="/dashboard"
						className="flex items-center justify-center size-11 rounded-full text-[--system-accent] hover:bg-[--system-surface-secondary] transition-colors"
					>
						<HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
					</Link>
					<h1 className="ios-large-title text-[--system-text-primary]">
						Settings
					</h1>
				</div>

				<div className="px-4 pb-4">
					<SegmentedControl
						value={activeTab}
						onValueChange={setActiveTab}
						items={tabs}
					/>
				</div>

				<div className="flex-1 px-4 pb-8">
					<AnimatePresence mode="wait" initial={false}>
						<motion.div
							key={activeTab}
							initial={{ opacity: 0, y: 4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.2, ease: iOSEase }}
						>
							{activeTab === "appearance" && <AppearanceTab />}

							{activeTab === "study" && (
								<StudyTab
									studyPrefs={studyPrefs}
									onStudyPrefsChange={setStudyPrefs}
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
				</div>

				<div className="px-4 pb-8">
					<button
						type="button"
						onClick={() => {
							saveToStorage(STUDY_PREFS_KEY, studyPrefs);
							saveToStorage(NOTIFICATION_SETTINGS_KEY, notifications);
							saveToStorage(BETA_FEATURES_KEY, betaFeatures);
						}}
						className="w-full h-11 rounded-[12px] bg-[--system-accent] text-[#ffffff] text-sm font-semibold hover:opacity-90 transition-opacity"
					>
						Save Changes
					</button>
				</div>
			</div>
		</div>
	);
}

export function SettingsClient() {
	return (
		<Suspense
			fallback={<div className="p-8 text-center">Loading settings...</div>}
		>
			<SettingsContent />
		</Suspense>
	);
}
