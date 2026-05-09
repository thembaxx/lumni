"use client";

import {
	ArrowLeftIcon,
	NotificationIcon,
	SaveIcon,
	Settings01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database, FlaskConical, type LucideIcon, Palette } from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
import { signOut, useSession } from "@/lib/auth-client";
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

function SettingsContent() {
	const { data: session } = useSession();
	const router = useRouter();

	const [studyPrefs, setStudyPrefs] =
		useState<StudyPreferences>(DEFAULT_PREFERENCES);
	const [notifications, setNotifications] = useState<NotificationSettings>(
		DEFAULT_NOTIFICATIONS,
	);
	const [betaFeatures, setBetaFeatures] = useState<BetaFeatures>(DEFAULT_BETA);
	const [activeTab, setActiveTab] = useState("appearance");
	const [isSaving, setIsSaving] = useState(false);
	const [saveMessage, setSaveMessage] = useState("");

	const hasAccount = !!session?.user;
	const user = session?.user;

	useEffect(() => {
		setStudyPrefs(loadFromStorage(STUDY_PREFS_KEY, DEFAULT_PREFERENCES));
		setNotifications(
			loadFromStorage(NOTIFICATION_SETTINGS_KEY, DEFAULT_NOTIFICATIONS),
		);
		setBetaFeatures(loadFromStorage(BETA_FEATURES_KEY, DEFAULT_BETA));
	}, []);

	const handleSavePreferences = () => {
		setIsSaving(true);
		saveToStorage(STUDY_PREFS_KEY, studyPrefs);
		saveToStorage(NOTIFICATION_SETTINGS_KEY, notifications);
		saveToStorage(BETA_FEATURES_KEY, betaFeatures);
		setTimeout(() => {
			setIsSaving(false);
			setSaveMessage("Settings saved!");
			setTimeout(() => setSaveMessage(""), 2000);
		}, 500);
	};

	const handleSignOut = async () => {
		await signOut();
		router.push("/");
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

	const tabs = [
		{ id: "appearance", label: "Appearance", icon: Palette, isLucide: true },
		{ id: "study", label: "Study", icon: Settings01Icon, isLucide: false },
		...(hasAccount
			? [
					{
						id: "profile",
						label: "Profile",
						icon: NotificationIcon as typeof ArrowLeftIcon,
						isLucide: false,
					},
				]
			: []),
		...(hasAccount
			? [
					{
						id: "notifications",
						label: "Notifications",
						icon: NotificationIcon,
						isLucide: false,
					},
				]
			: []),
		{ id: "data", label: "Data", icon: Database, isLucide: true },
		{
			id: "beta",
			label: "Beta",
			icon: FlaskConical,
			isLucide: true,
		},
	];

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

				<div className="flex flex-col gap-6 lg:flex-row lg:items-start">
					<Card className="w-full shrink-0 lg:w-56 border-border/50 shadow-sm">
						<CardContent className="p-2">
							<nav className="flex flex-row gap-1 lg:flex-col">
								{tabs.map((tab) => (
									<button
										key={tab.id}
										onClick={() => setActiveTab(tab.id)}
										className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:justify-start ${
											activeTab === tab.id
												? "bg-primary/10 text-primary"
												: "text-muted-foreground hover:bg-muted hover:text-foreground"
										}`}
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
										<span className="hidden lg:inline">{tab.label}</span>
									</button>
								))}
							</nav>
						</CardContent>
					</Card>

					<div className="flex-1 space-y-6">
						{activeTab === "appearance" && <AppearanceTab />}

						{activeTab === "study" && (
							<StudyTab
								studyPrefs={studyPrefs}
								onStudyPrefsChange={setStudyPrefs}
							/>
						)}

						{activeTab === "profile" && hasAccount && user && (
							<ProfileTab user={user} onSignOut={handleSignOut} />
						)}

						{activeTab === "notifications" && hasAccount && (
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

						<div className="flex items-center justify-between">
							<p className="text-sm text-muted-foreground">{saveMessage}</p>
							<Button onClick={handleSavePreferences} disabled={isSaving}>
								<HugeiconsIcon icon={SaveIcon} className="mr-2 size-4" />
								{isSaving ? "Saving..." : "Save Changes"}
							</Button>
						</div>
					</div>
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
