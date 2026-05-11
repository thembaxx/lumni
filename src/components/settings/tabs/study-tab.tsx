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
		<div className="space-y-6">
			<section>
				<div className="ios-footnote font-semibold text-[--system-text-secondary] uppercase tracking-wide px-4 py-2 pt-5">
					Study Preferences
				</div>
				<div className="overflow-hidden rounded-[16px] bg-[--system-surface] shadow-[--shadow-level-1]">
					<div className="ios-separator">
						<div className="px-4 py-3 space-y-1">
							<label className="ios-body font-medium text-[--system-text-primary] block">
								Default Difficulty
							</label>
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
					</div>
					<div className="ios-separator">
						<div className="px-4 py-3 space-y-1">
							<label className="ios-body font-medium text-[--system-text-primary] block">
								Questions per Session
							</label>
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
					<div className="ios-separator">
						<div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
							<div className="space-y-0.5">
								<p className="ios-body font-medium text-[--system-text-primary]">
									Timer
								</p>
								<p className="ios-footnote text-[--system-text-secondary]">
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
					</div>
					{studyPrefs.timerEnabled && (
						<div className="ios-separator">
							<div className="ml-6 px-4 py-3 space-y-1">
								<label className="ios-body font-medium text-[--system-text-primary] block">
									Timer Duration (seconds)
								</label>
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
						</div>
					)}
					<div className="flex items-center justify-between px-4 py-3 min-h-[44px]">
						<div className="space-y-0.5">
							<p className="ios-body font-medium text-[--system-text-primary]">
								Show Explanations
							</p>
							<p className="ios-footnote text-[--system-text-secondary]">
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
				</div>
			</section>
		</div>
	);
}
