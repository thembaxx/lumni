import { RadialIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useTranslations } from "next-intl";

export default function QuizLoading() {
	const t = useTranslations();
	return (
		<div className="flex min-h-dvh flex-col items-center justify-center gap-4">
			<HugeiconsIcon
				icon={RadialIcon}
				className="size-10 animate-spin text-system-accent"
			/>
			<p className="text-muted-foreground text-sm">{t("quiz.preparing")}</p>
		</div>
	);
}
