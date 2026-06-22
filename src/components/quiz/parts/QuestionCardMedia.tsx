import Add01Icon from "@hugeicons/core-free-icons/Add01Icon";
import MinusSignIcon from "@hugeicons/core-free-icons/MinusSignIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import type { MediaContent } from "@/lib/question-engine/types";
import type { VisualContent as VisualContentType } from "@/lib/visual-engine/types";
import { QuestionDiagram } from "../question-diagram";

interface QuestionCardMediaProps {
  visual: VisualContentType | undefined | null;
  isLoading: boolean;
  questionMedia: MediaContent[];
  showDiagram: boolean;
  onToggleDiagram: () => void;
  hasDiagram: boolean;
}

export function QuestionCardMedia({
  visual: _visual,
  isLoading,
  questionMedia,
  showDiagram,
  onToggleDiagram,
  hasDiagram,
}: QuestionCardMediaProps) {
  const t = useTranslations();
  // If we are loading the visual, show a skeleton
  if (isLoading) {
    return (
      <div className="relative">
        <div className="h-48 w-full rounded bg-muted/50" />
      </div>
    );
  }

  if (!hasDiagram) {
    return null;
  }

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-muted-foreground text-xs">{t("quiz.diagram")}</p>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleDiagram}
          className="h-8 gap-1 px-2"
          aria-label={showDiagram ? t("quiz.hideDiagram") : t("quiz.showDiagram")}
        >
          {showDiagram ? (
            <>
              <HugeiconsIcon icon={MinusSignIcon} data-icon="inline-start" />
              <span className="text-xs">{t("quiz.hide")}</span>
            </>
          ) : (
            <>
              <HugeiconsIcon icon={Add01Icon} data-icon="inline-start" />
              <span className="text-xs">{t("quiz.show")}</span>
            </>
          )}
        </Button>
      </div>
      {showDiagram &&
        questionMedia.map((m) => (
          <div key={`media-${m.label}`} className="mt-2">
            {m.diagramData && <QuestionDiagram diagram={m.diagramData} />}
          </div>
        ))}
    </div>
  );
}
