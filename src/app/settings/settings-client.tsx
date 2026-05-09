"use client";

import { ArrowLeftIcon, Settings01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database, FlaskConical, type LucideIcon, Palette } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import {
	AppearanceTab,
	BetaTab,
	DataTab,
	StudyTab,
} from "@/components/settings/tabs";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
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
	{ id: "appearance", label: "Appearance", icon: Palette, isLucide: true },
	{ id: "study", label: "Study", icon: Settings01Icon, isLucide: false },
	{ id: "data", label: "Data", icon: Database, isLucide: true },
	{
		id: "beta",
		label: "Beta",
		icon: FlaskConical,
		isLucide: true,
	},
];

const tabContentVariants = {
	initial: { opacity: 0, y: 8 },
	animate: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -8 },
};

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
		<div className="min-h-screen bg-background">
			<div className="mx-auto max-w-4xl p-4 md:p-8">
				<div className="mb-8 flex items-center gap-4">
					<Link href="/dashboard">
						<Button variant="ghost" size="icon" className="shrink-0">
							<HugeiconsIcon icon={ArrowLeftIcon} className="size-5" />
						</Button>
					</Link>
					<div>
						<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
						<p className="text-muted-foreground">
							Manage your preferences and account
						</p>
					</div>
				</div>

				<Tabs
					value={activeTab}
					onValueChange={setActiveTab}
					className="flex flex-col"
				>
					<TabsList className="flex w-full overflow-x-auto justify-start px-4 py-2 gap-2 bg-card rounded-full overscroll-none border-b shrink-0 scrollbar-hide">
						{tabs.map((tab) => (
							<TabsTrigger
								key={tab.id}
								value={tab.id}
								className={cn(
									"flex-shrink-0 px-3 py-2 text-xs font-medium rounded-full gap-1.5 transition-all duration-200",
									"data-[active]:bg-primary data-[active]:text-primary-foreground",
									"text-muted-foreground hover:text-foreground hover:scale-[1.02] active:scale-[0.96] transition-transform",
								)}
							>
								{tab.isLucide ? (
									(() => {
										const Icon = tab.icon as LucideIcon;
										return <Icon className="size-4 shrink-0" />;
									})()
								) : (
									<HugeiconsIcon
										icon={tab.icon as typeof ArrowLeftIcon}
										className="size-4 shrink-0"
									/>
								)}
								{tab.label}
							</TabsTrigger>
						))}
					</TabsList>

					<div className="flex-1 space-y-6">
								<AnimatePresence mode="wait" initial={false}>
									<motion.div
										key={activeTab}
										variants={tabContentVariants}
										initial="initial"
										animate="animate"
										exit="exit"
										transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
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

						<div className="flex items-center justify-end">
							<Button
								onClick={() => {
									saveToStorage(STUDY_PREFS_KEY, studyPrefs);
									saveToStorage(NOTIFICATION_SETTINGS_KEY, notifications);
									saveToStorage(BETA_FEATURES_KEY, betaFeatures);
								}}
								className="text-xs px-4"
								size="lg"
							>
								Save Changes
							</Button>
						</div>
					</div>
				</Tabs>
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
