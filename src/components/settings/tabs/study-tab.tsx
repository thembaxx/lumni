import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
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
import type { StudyPreferences } from "@/lib/utils/storage";

interface StudyTabProps {
	studyPrefs: StudyPreferences;
	onStudyPrefsChange: (prefs: StudyPreferences) => void;
}

export function StudyTab({ studyPrefs, onStudyPrefsChange }: StudyTabProps) {
	return (
		<Card className="border-border/50 shadow-sm">
			<CardHeader className="pb-4">
				<CardTitle className="text-lg">Study Preferences</CardTitle>
				<CardDescription>Customize your study experience</CardDescription>
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid gap-4 md:grid-cols-2">
					<div className="space-y-2">
						<Label htmlFor="difficulty">Default Difficulty</Label>
						<Select
							value={studyPrefs.difficulty}
							onValueChange={(v) =>
								onStudyPrefsChange({
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
						<Label htmlFor="questionCount">Questions per Session</Label>
						<Select
							value={studyPrefs.questionCount.toString()}
							onValueChange={(v) =>
								onStudyPrefsChange({
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
								onStudyPrefsChange({
									...studyPrefs,
									timerEnabled: checked,
								})
							}
						/>
					</div>
					{studyPrefs.timerEnabled && (
						<div className="ml-6 space-y-2">
							<Label htmlFor="timerDuration">Timer Duration (seconds)</Label>
							<Select
								value={studyPrefs.timerDuration.toString()}
								onValueChange={(v) =>
									onStudyPrefsChange({
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
							onStudyPrefsChange({
								...studyPrefs,
								showExplanations: checked,
							})
						}
					/>
				</div>
			</CardContent>
		</Card>
	);
}
