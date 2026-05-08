import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { BetaFeatures } from "@/lib/utils/storage";

interface BetaTabProps {
	betaFeatures: BetaFeatures;
	onBetaFeaturesChange: (features: BetaFeatures) => void;
}

export function BetaTab({ betaFeatures, onBetaFeaturesChange }: BetaTabProps) {
	return (
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
								onBetaFeaturesChange({ ...betaFeatures, aiTutor: checked })
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
								onBetaFeaturesChange({
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
							<p className="text-sm font-medium">Exam Paper Analysis</p>
							<p className="text-xs text-muted-foreground">
								Upload exam papers for AI-powered analysis
							</p>
						</div>
						<Switch
							checked={betaFeatures.examPaperAnalysis}
							onCheckedChange={(checked) =>
								onBetaFeaturesChange({
									...betaFeatures,
									examPaperAnalysis: checked,
								})
							}
						/>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
