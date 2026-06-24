import { ListSection } from "@/components/ui/list-cell";
import { LabelledSwitch } from "@/components/ui/labelled-switch";
import type { BetaFeatures } from "@/lib/utils/storage";

interface BetaTabProps {
  betaFeatures: BetaFeatures;
  onBetaFeaturesChange: (features: BetaFeatures) => void;
}

export function BetaTab({ betaFeatures, onBetaFeaturesChange }: BetaTabProps) {
  return (
    <ListSection header="Beta Features" footer="Experimental features still in development">
      <LabelledSwitch
        title="AI Study Tutor"
        subtitle="Get AI-powered explanations and study help"
        checked={betaFeatures.aiTutor}
        onCheckedChange={(checked) => onBetaFeaturesChange({ ...betaFeatures, aiTutor: checked })}
      />
      <LabelledSwitch
        title="Voice Practice"
        subtitle="Practice pronunciation with voice recording"
        checked={betaFeatures.voicePractice}
        onCheckedChange={(checked) =>
          onBetaFeaturesChange({ ...betaFeatures, voicePractice: checked })
        }
      />
      <LabelledSwitch
        title="Exam Paper Analysis"
        subtitle="Upload exam papers for AI-powered analysis"
        showSeparator={false}
        checked={betaFeatures.examPaperAnalysis}
        onCheckedChange={(checked) =>
          onBetaFeaturesChange({ ...betaFeatures, examPaperAnalysis: checked })
        }
      />
    </ListSection>
  );
}
