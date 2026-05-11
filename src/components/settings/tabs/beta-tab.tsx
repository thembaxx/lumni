import { ListCell, ListSection } from "@/components/ui/list-cell";
import { Switch } from "@/components/ui/switch";
import type { BetaFeatures } from "@/lib/utils/storage";

interface BetaTabProps {
	betaFeatures: BetaFeatures;
	onBetaFeaturesChange: (features: BetaFeatures) => void;
}

export function BetaTab({ betaFeatures, onBetaFeaturesChange }: BetaTabProps) {
	return (
		<ListSection
			header="Beta Features"
			footer="Try experimental features (may be unstable)"
		>
			<ListCell
				title="AI Study Tutor"
				subtitle="Get AI-powered explanations and study help"
				trailing={
					<Switch
						checked={betaFeatures.aiTutor}
						onCheckedChange={(checked) =>
							onBetaFeaturesChange({ ...betaFeatures, aiTutor: checked })
						}
					/>
				}
			/>
			<ListCell
				title="Voice Practice"
				subtitle="Practice pronunciation with voice recording"
				trailing={
					<Switch
						checked={betaFeatures.voicePractice}
						onCheckedChange={(checked) =>
							onBetaFeaturesChange({
								...betaFeatures,
								voicePractice: checked,
							})
						}
					/>
				}
			/>
			<ListCell
				title="Exam Paper Analysis"
				subtitle="Upload exam papers for AI-powered analysis"
				showSeparator={false}
				trailing={
					<Switch
						checked={betaFeatures.examPaperAnalysis}
						onCheckedChange={(checked) =>
							onBetaFeaturesChange({
								...betaFeatures,
								examPaperAnalysis: checked,
							})
						}
					/>
				}
			/>
		</ListSection>
	);
}
