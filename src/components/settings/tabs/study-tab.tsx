import { Label } from "@/components/ui/label";
import { ListCell, ListGroup, ListSection } from "@/components/ui/list-cell";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { StudyPreferences } from "@/lib/utils/storage";

interface StudyTabProps {
	studyPrefs: StudyPreferences;
	onStudyPrefsChange: (prefs: StudyPreferences) => void;
}

export function StudyTab({ studyPrefs, onStudyPrefsChange }: StudyTabProps) {
	return (
		<div className="space-y-[--space-4]">
			<ListSection
				header="Study Experience"
				footer="Customize your learning session defaults"
			>
				<ListCell
					title="Default Difficulty"
					subtitle="Starting difficulty for new sessions"
					trailing={
						<Select
							value={studyPrefs.difficulty}
							onValueChange={(v) =>
								onStudyPrefsChange({
									...studyPrefs,
									difficulty: v as StudyPreferences["difficulty"],
								})
							}
						>
							<SelectTrigger className="w-[100px] h-9 border-none bg-secondary/50 focus:ring-0">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="easy">Easy</SelectItem>
								<SelectItem value="medium">Medium</SelectItem>
								<SelectItem value="hard">Hard</SelectItem>
							</SelectContent>
						</Select>
					}
				/>
				<ListCell
					title="Questions per Session"
					subtitle="Number of questions in a study block"
					trailing={
						<Select
							value={studyPrefs.questionCount.toString()}
							onValueChange={(v) =>
								onStudyPrefsChange({
									...studyPrefs,
									questionCount: parseInt(v || "10"),
								})
							}
						>
							<SelectTrigger className="w-[120px] h-9 border-none bg-secondary/50 focus:ring-0">
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
					}
				/>
				<ListCell
					title="Show Explanations"
					subtitle="Display answer feedback after each question"
					showSeparator={false}
					trailing={
						<Switch
							checked={studyPrefs.showExplanations}
							onCheckedChange={(checked) =>
								onStudyPrefsChange({
									...studyPrefs,
									showExplanations: checked,
								})
							}
						/>
					}
				/>
			</ListSection>

			<ListSection
				header="Timer Settings"
				footer="Challenge yourself with timed sessions"
			>
				<ListCell
					title="Session Timer"
					subtitle="Enable countdown for questions"
					trailing={
						<Switch
							checked={studyPrefs.timerEnabled}
							onCheckedChange={(checked) =>
								onStudyPrefsChange({
									...studyPrefs,
									timerEnabled: checked,
								})
							}
						/>
					}
				/>
				{studyPrefs.timerEnabled && (
					<ListCell
						title="Timer Duration"
						subtitle="Seconds allowed per question"
						showSeparator={false}
						trailing={
							<Select
								value={studyPrefs.timerDuration.toString()}
								onValueChange={(v) =>
									onStudyPrefsChange({
										...studyPrefs,
										timerDuration: parseInt(v || "30"),
									})
								}
							>
								<SelectTrigger className="w-[120px] h-9 border-none bg-secondary/50 focus:ring-0">
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
						}
					/>
				)}
			</ListSection>
		</div>
	);
}
