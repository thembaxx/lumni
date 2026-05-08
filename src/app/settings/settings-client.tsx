"use client";

import {
	ArrowLeftIcon,
	DownloadIcon,
	FlaskConical,
	LogoutIcon,
	NotificationIcon,
	SaveIcon,
	Settings01Icon,
	UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Database, type LucideIcon, Palette, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ThemeSwitcher } from "@/components/theme";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { signOut, useSession } from "@/lib/auth-client";

type StudyPreferences = {
	difficulty: "easy" | "medium" | "hard";
	questionCount: number;
	timerEnabled: boolean;
	timerDuration: number;
	showExplanations: boolean;
};

type NotificationSettings = {
	studyReminders: boolean;
	streakAlerts: boolean;
	achievementNotifications: boolean;
	weeklyProgress: boolean;
};

type BetaFeatures = {
	aiTutor: boolean;
	voicePractice: boolean;
	examPaperAnalysis: boolean;
};

const DEFAULT_PREFERENCES: StudyPreferences = {
	difficulty: "medium",
	questionCount: 10,
	timerEnabled: true,
	timerDuration: 30,
	showExplanations: true,
};

const DEFAULT_NOTIFICATIONS: NotificationSettings = {
	studyReminders: true,
	streakAlerts: true,
	achievementNotifications: true,
	weeklyProgress: false,
};

const DEFAULT_BETA: BetaFeatures = {
	aiTutor: false,
	voicePractice: false,
	examPaperAnalysis: false,
};

function loadFromStorage<T>(key: string, defaultValue: T): T {
	if (typeof window === "undefined") return defaultValue;
	try {
		const stored = localStorage.getItem(key);
		return stored ? JSON.parse(stored) : defaultValue;
	} catch {
		return defaultValue;
	}
}

function saveToStorage<T>(key: string, value: T): void {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.error("Failed to save to localStorage:", e);
	}
}

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
		setStudyPrefs(loadFromStorage("study-preferences", DEFAULT_PREFERENCES));
		setNotifications(
			loadFromStorage("notification-settings", DEFAULT_NOTIFICATIONS),
		);
		setBetaFeatures(loadFromStorage("beta-features", DEFAULT_BETA));
	}, []);

	const handleSavePreferences = () => {
		setIsSaving(true);
		saveToStorage("study-preferences", studyPrefs);
		saveToStorage("notification-settings", notifications);
		saveToStorage("beta-features", betaFeatures);
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
			localStorage.removeItem("study-preferences");
			localStorage.removeItem("notification-settings");
			localStorage.removeItem("beta-features");
			setStudyPrefs(DEFAULT_PREFERENCES);
			setNotifications(DEFAULT_NOTIFICATIONS);
			setBetaFeatures(DEFAULT_BETA);
		}
	};

	const tabs = [
		{ id: "appearance", label: "Appearance", icon: Palette, isLucide: true },
		{ id: "study", label: "Study", icon: Settings01Icon, isLucide: false },
		...(hasAccount
			? [{ id: "profile", label: "Profile", icon: UserIcon, isLucide: false }]
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
			isLucide: false,
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
										className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all lg:justify-start ${
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
						{activeTab === "appearance" && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Appearance</CardTitle>
									<CardDescription>
										Customize how the application looks
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4">
										<div className="space-y-1">
											<p className="text-sm font-medium">Theme</p>
											<p className="text-xs text-muted-foreground">
												Select your preferred color scheme
											</p>
										</div>
										<ThemeSwitcher />
									</div>
								</CardContent>
							</Card>
						)}

						{activeTab === "study" && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Study Preferences</CardTitle>
									<CardDescription>
										Customize your study experience
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="difficulty">Default Difficulty</Label>
											<Select
												value={studyPrefs.difficulty}
												onValueChange={(v) =>
													setStudyPrefs({
														...studyPrefs,
														difficulty: v as StudyPreferences["difficulty"],
													})
												}
											>
												<SelectTrigger id="difficulty">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="easy">Easy</SelectItem>
													<SelectItem value="medium">Medium</SelectItem>
													<SelectItem value="hard">Hard</SelectItem>
												</SelectContent>
											</Select>
										</div>
										<div className="space-y-2">
											<Label htmlFor="questionCount">
												Questions per Session
											</Label>
											<Select
												value={studyPrefs.questionCount.toString()}
												onValueChange={(v) =>
													setStudyPrefs({
														...studyPrefs,
														questionCount: parseInt(v || "10"),
													})
												}
											>
												<SelectTrigger id="questionCount">
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="5">5 questions</SelectItem>
													<SelectItem value="10">10 questions</SelectItem>
													<SelectItem value="15">15 questions</SelectItem>
													<SelectItem value="20">20 questions</SelectItem>
													<SelectItem value="25">25 questions</SelectItem>
												</SelectContent>
											</Select>
										</div>
									</div>

									<Separator />

									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Timer</p>
												<p className="text-xs text-muted-foreground">
													Enable countdown timer for questions
												</p>
											</div>
											<Switch
												checked={studyPrefs.timerEnabled}
												onCheckedChange={(checked) =>
													setStudyPrefs({
														...studyPrefs,
														timerEnabled: checked,
													})
												}
											/>
										</div>
										{studyPrefs.timerEnabled && (
											<div className="ml-6 space-y-2">
												<Label htmlFor="timerDuration">
													Timer Duration (seconds)
												</Label>
												<Select
													value={studyPrefs.timerDuration.toString()}
													onValueChange={(v) =>
														setStudyPrefs({
															...studyPrefs,
															timerDuration: parseInt(v || "30"),
														})
													}
												>
													<SelectTrigger id="timerDuration" className="w-40">
														<SelectValue />
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="15">15 seconds</SelectItem>
														<SelectItem value="30">30 seconds</SelectItem>
														<SelectItem value="45">45 seconds</SelectItem>
														<SelectItem value="60">60 seconds</SelectItem>
														<SelectItem value="90">90 seconds</SelectItem>
													</SelectContent>
												</Select>
											</div>
										)}
									</div>

									<Separator />

									<div className="flex items-center justify-between">
										<div className="space-y-1">
											<p className="text-sm font-medium">Show Explanations</p>
											<p className="text-xs text-muted-foreground">
												Display answer explanations after each question
											</p>
										</div>
										<Switch
											checked={studyPrefs.showExplanations}
											onCheckedChange={(checked) =>
												setStudyPrefs({
													...studyPrefs,
													showExplanations: checked,
												})
											}
										/>
									</div>
								</CardContent>
							</Card>
						)}

						{activeTab === "profile" && hasAccount && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Profile</CardTitle>
									<CardDescription>
										Manage your account information
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="flex items-center gap-4">
										<Avatar className="size-16">
											<AvatarImage src={user?.image || ""} />
											<AvatarFallback>
												{user?.name?.charAt(0) || "U"}
											</AvatarFallback>
										</Avatar>
										<div>
											<p className="font-medium">{user?.name}</p>
											<p className="text-sm text-muted-foreground">
												{user?.email}
											</p>
										</div>
									</div>

									<Separator />

									<div className="space-y-4">
										<div className="space-y-2">
											<Label htmlFor="name">Display Name</Label>
											<Input
												id="name"
												defaultValue={user?.name || ""}
												placeholder="Your name"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="email">Email</Label>
											<Input
												id="email"
												type="email"
												defaultValue={user?.email || ""}
												disabled
												className="bg-muted/50"
											/>
											<p className="text-xs text-muted-foreground">
												Email cannot be changed
											</p>
										</div>
									</div>

									<Separator />

									<Button
										variant="destructive"
										onClick={handleSignOut}
										className="w-full"
									>
										<HugeiconsIcon icon={LogoutIcon} className="mr-2 size-4" />
										Sign Out
									</Button>
								</CardContent>
							</Card>
						)}

						{activeTab === "notifications" && hasAccount && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Notifications</CardTitle>
									<CardDescription>
										Manage your notification preferences
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="space-y-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Study Reminders</p>
												<p className="text-xs text-muted-foreground">
													Get reminded to study daily
												</p>
											</div>
											<Switch
												checked={notifications.studyReminders}
												onCheckedChange={(checked) =>
													setNotifications({
														...notifications,
														studyReminders: checked,
													})
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Streak Alerts</p>
												<p className="text-xs text-muted-foreground">
													Notify when streak is at risk
												</p>
											</div>
											<Switch
												checked={notifications.streakAlerts}
												onCheckedChange={(checked) =>
													setNotifications({
														...notifications,
														streakAlerts: checked,
													})
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">
													Achievement Notifications
												</p>
												<p className="text-xs text-muted-foreground">
													Notify when you unlock achievements
												</p>
											</div>
											<Switch
												checked={notifications.achievementNotifications}
												onCheckedChange={(checked) =>
													setNotifications({
														...notifications,
														achievementNotifications: checked,
													})
												}
											/>
										</div>

										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Weekly Progress</p>
												<p className="text-xs text-muted-foreground">
													Receive weekly progress summary
												</p>
											</div>
											<Switch
												checked={notifications.weeklyProgress}
												onCheckedChange={(checked) =>
													setNotifications({
														...notifications,
														weeklyProgress: checked,
													})
												}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{activeTab === "data" && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Data Management</CardTitle>
									<CardDescription>Export or clear your data</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="rounded-lg border border-border/50 bg-card/50 p-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Export Settings</p>
												<p className="text-xs text-muted-foreground">
													Download your preferences as JSON
												</p>
											</div>
											<Button variant="outline" onClick={handleExportData}>
												<HugeiconsIcon
													icon={DownloadIcon}
													className="mr-2 size-4"
												/>
												Export
											</Button>
										</div>
									</div>

									<Separator />

									<div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium text-destructive">
													Clear Local Data
												</p>
												<p className="text-xs text-muted-foreground">
													Reset all preferences to defaults
												</p>
											</div>
											<Button variant="destructive" onClick={handleClearCache}>
												<Trash2 className="mr-2 size-4" />
												Clear
											</Button>
										</div>
									</div>
								</CardContent>
							</Card>
						)}

						{activeTab === "beta" && (
							<Card className="border-border/50 shadow-sm">
								<CardHeader className="pb-4">
									<CardTitle className="text-lg">Beta Features</CardTitle>
									<CardDescription>
										Try experimental features (may be unstable)
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-6">
									<div className="rounded-lg border border-border/50 bg-card/50 p-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">AI Study Tutor</p>
												<p className="text-xs text-muted-foreground">
													Get AI-powered explanations and study help
												</p>
											</div>
											<Switch
												checked={betaFeatures.aiTutor}
												onCheckedChange={(checked) =>
													setBetaFeatures({ ...betaFeatures, aiTutor: checked })
												}
											/>
										</div>
									</div>

									<div className="rounded-lg border border-border/50 bg-card/50 p-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">Voice Practice</p>
												<p className="text-xs text-muted-foreground">
													Practice pronunciation with voice recording
												</p>
											</div>
											<Switch
												checked={betaFeatures.voicePractice}
												onCheckedChange={(checked) =>
													setBetaFeatures({
														...betaFeatures,
														voicePractice: checked,
													})
												}
											/>
										</div>
									</div>

									<div className="rounded-lg border border-border/50 bg-card/50 p-4">
										<div className="flex items-center justify-between">
											<div className="space-y-1">
												<p className="text-sm font-medium">
													Exam Paper Analysis
												</p>
												<p className="text-xs text-muted-foreground">
													Upload exam papers for AI-powered analysis
												</p>
											</div>
											<Switch
												checked={betaFeatures.examPaperAnalysis}
												onCheckedChange={(checked) =>
													setBetaFeatures({
														...betaFeatures,
														examPaperAnalysis: checked,
													})
												}
											/>
										</div>
									</div>
								</CardContent>
							</Card>
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
