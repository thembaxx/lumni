import { useMemo } from "react";
import { ListCell, ListSection } from "@/components/ui/list-cell";
import { Switch } from "@/components/ui/switch";
import type { BetaFeatures } from "@/lib/utils/storage";

interface BetaTabProps {
  betaFeatures: BetaFeatures;
  onBetaFeaturesChange: (features: BetaFeatures) => void;
}

export function BetaTab({ betaFeatures, onBetaFeaturesChange }: BetaTabProps) {
  const aiTutorTrailing = useMemo(
    () => (
      <Switch
        checked={betaFeatures.aiTutor}
        onCheckedChange={(checked) => onBetaFeaturesChange({ ...betaFeatures, aiTutor: checked })}
      />
    ),
    [betaFeatures, onBetaFeaturesChange],
  );
  const voicePracticeTrailing = useMemo(
    () => (
      <Switch
        checked={betaFeatures.voicePractice}
        onCheckedChange={(checked) =>
          onBetaFeaturesChange({
            ...betaFeatures,
            voicePractice: checked,
          })
        }
      />
    ),
    [betaFeatures, onBetaFeaturesChange],
  );
  const examPaperAnalysisTrailing = useMemo(
    () => (
      <Switch
        checked={betaFeatures.examPaperAnalysis}
        onCheckedChange={(checked) =>
          onBetaFeaturesChange({
            ...betaFeatures,
            examPaperAnalysis: checked,
          })
        }
      />
    ),
    [betaFeatures, onBetaFeaturesChange],
  );

  return (
    <ListSection header="Beta Features" footer="Experimental features still in development">
      <ListCell
        title="AI Study Tutor"
        subtitle="Get AI-powered explanations and study help"
        trailing={aiTutorTrailing}
      />
      <ListCell
        title="Voice Practice"
        subtitle="Practice pronunciation with voice recording"
        trailing={voicePracticeTrailing}
      />
      <ListCell
        title="Exam Paper Analysis"
        subtitle="Upload exam papers for AI-powered analysis"
        showSeparator={false}
        trailing={examPaperAnalysisTrailing}
      />
    </ListSection>
  );
}
