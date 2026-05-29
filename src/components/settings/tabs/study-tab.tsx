import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useSRSettings } from "@/hooks/use-sr-settings";
import type { StudyPreferences } from "@/lib/utils/storage";

interface StudyTabProps {
	studyPrefs: StudyPreferences;
	onStudyPrefsChange: (prefs: StudyPreferences) => void;
}

export function StudyTab({ studyPrefs, onStudyPrefsChange }: StudyTabProps) {
	const { settings: sr, updateSettings: updateSr } = useSRSettings();

	const defaultDifficultyTrailing = useMemo(
		() => (
			<Select
				value={studyPrefs.difficulty}
				onValueChange={(v) =>
					onStudyPrefsChange({
						...studyPrefs,
						difficulty: v as StudyPreferences["difficulty"],
					})
				}
			>
				<SelectTrigger className="h-9 w-25 border-none bg-secondary/50 focus:ring-0">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="easy">Easy</SelectItem>
					<SelectItem value="medium">Medium</SelectItem>
					<SelectItem value="hard">Hard</SelectItem>
				</SelectContent>
			</Select>
		),
		[studyPrefs, onStudyPrefsChange],
	);
	const questionsPerSessionTrailing = useMemo(
		() => (
			<Select
				value={studyPrefs.questionCount.toString()}
				onValueChange={(v) =>
					onStudyPrefsChange({
						...studyPrefs,
						questionCount: parseInt(v || "10", 10),
					})
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
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
		),
		[studyPrefs, onStudyPrefsChange],
	);
	const showExplanationsTrailing = useMemo(
		() => (
			<Switch
				checked={studyPrefs.showExplanations}
				onCheckedChange={(checked) =>
					onStudyPrefsChange({
						...studyPrefs,
						showExplanations: checked,
					})
				}
			/>
		),
		[studyPrefs, onStudyPrefsChange],
	);
	const sessionTimerTrailing = useMemo(
		() => (
			<Switch
				checked={studyPrefs.timerEnabled}
				onCheckedChange={(checked) =>
					onStudyPrefsChange({
						...studyPrefs,
						timerEnabled: checked,
					})
				}
			/>
		),
		[studyPrefs, onStudyPrefsChange],
	);
	const timerDurationTrailing = useMemo(
		() => (
			<Select
				value={studyPrefs.timerDuration.toString()}
				onValueChange={(v) =>
					onStudyPrefsChange({
						...studyPrefs,
						timerDuration: parseInt(v || "30", 10),
					})
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
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
		),
		[studyPrefs, onStudyPrefsChange],
	);
	const learningStepsTrailing = useMemo(
		() => (
			<Input
				type="text"
				value={sr.learningSteps.join(",")}
				onChange={(e) => {
					const steps = e.target.value
						.split(",")
						.map((s) => parseInt(s.trim(), 10))
						.filter((n) => !Number.isNaN(n) && n > 0);
					if (steps.length > 0) updateSr({ learningSteps: steps });
				}}
				className="h-9 w-[140px] border-none bg-secondary/50 text-right text-xs focus:ring-0"
			/>
		),
		[sr.learningSteps, updateSr],
	);
	const maxNewCardsTrailing = useMemo(
		() => (
			<Select
				value={sr.dailyNewLimit.toString()}
				onValueChange={(v) =>
					updateSr({ dailyNewLimit: parseInt(v ?? "20", 10) })
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{[5, 10, 15, 20, 25, 30, 50].map((n) => (
						<SelectItem key={n} value={n.toString()}>
							{n}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		),
		[sr.dailyNewLimit, updateSr],
	);
	const maxReviewsTrailing = useMemo(
		() => (
			<Select
				value={sr.dailyReviewLimit.toString()}
				onValueChange={(v) =>
					updateSr({ dailyReviewLimit: parseInt(v ?? "200", 10) })
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{[50, 100, 150, 200, 300, 500].map((n) => (
						<SelectItem key={n} value={n.toString()}>
							{n}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		),
		[sr.dailyReviewLimit, updateSr],
	);
	const leechThresholdTrailing = useMemo(
		() => (
			<Select
				value={sr.leechThreshold.toString()}
				onValueChange={(v) =>
					updateSr({ leechThreshold: parseInt(v ?? "8", 10) })
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{[4, 6, 8, 10, 12].map((n) => (
						<SelectItem key={n} value={n.toString()}>
							{n} lapses
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		),
		[sr.leechThreshold, updateSr],
	);
	const leechActionTrailing = useMemo(
		() => (
			<Select
				value={sr.leechAction}
				onValueChange={(v) =>
					updateSr({
						leechAction: v as "suspend" | "bury" | "tag-only",
					})
				}
			>
				<SelectTrigger className="h-9 w-[120px] border-none bg-secondary/50 focus:ring-0">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="suspend">Suspend</SelectItem>
					<SelectItem value="bury">Bury</SelectItem>
					<SelectItem value="tag-only">Tag Only</SelectItem>
				</SelectContent>
			</Select>
		),
		[sr.leechAction, updateSr],
	);

	return (
		<div className="flex flex-col gap-[--space-4]">
			<ListSection
				header="Study Experience"
				footer="Customize your learning session defaults"
			>
				<ListCell
					title="Default Difficulty"
					subtitle="Starting difficulty for new sessions"
					trailing={defaultDifficultyTrailing}
				/>
				<ListCell
					title="Questions per Session"
					subtitle="Number of questions in a study block"
					trailing={questionsPerSessionTrailing}
				/>
				<ListCell
					title="Show Explanations"
					subtitle="Display answer feedback after each question"
					showSeparator={false}
					trailing={showExplanationsTrailing}
				/>
			</ListSection>

			<ListSection
				header="Timer Settings"
				footer="Challenge yourself with timed sessions"
			>
				<ListCell
					title="Session Timer"
					subtitle="Enable countdown for questions"
					trailing={sessionTimerTrailing}
				/>
				{studyPrefs.timerEnabled && (
					<ListCell
						title="Timer Duration"
						subtitle="Seconds allowed per question"
						showSeparator={false}
						trailing={timerDurationTrailing}
					/>
				)}
			</ListSection>

			<ListSection
				header="Spaced Repetition"
				footer="Controls how flashcards schedule reviews"
			>
				<ListCell
					title="Learning Steps (minutes)"
					subtitle="Comma-separated: 1,10,1440 = 1min, 10min, 1 day"
					showSeparator={false}
					trailing={learningStepsTrailing}
				/>
				<ListCell
					title="Max New Cards / Day"
					subtitle="Limit new flashcards per day"
					trailing={maxNewCardsTrailing}
				/>
				<ListCell
					title="Max Reviews / Day"
					subtitle="Limit review cards per day"
					trailing={maxReviewsTrailing}
				/>
				<ListCell
					title="Leech Threshold"
					subtitle="Auto-suspend after this many failures"
					trailing={leechThresholdTrailing}
				/>
				<ListCell
					title="Leech Action"
					subtitle="What to do when a card becomes a leech"
					showSeparator={false}
					trailing={leechActionTrailing}
				/>
			</ListSection>
		</div>
	);
}
