"use client";

import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import PlayFreeIcons from "@hugeicons/core-free-icons/PlayIcon";
import { HugeiconsIcon } from "@hugeicons/react";
import * as m from "motion/react-m";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ModeSelectScreenProps {
	subject: string;
	paperCode: string;
	year: string | number;
	examPeriod: string;
	totalMarks: number;
	duration: string;
	onStartPractice: () => void;
	onStartTimed: () => void;
	onStartMock: () => void;
}

export function ModeSelectScreen({
	subject,
	paperCode,
	year,
	examPeriod,
	totalMarks,
	duration,
	onStartPractice,
	onStartTimed,
	onStartMock,
}: ModeSelectScreenProps) {
	const t = useTranslations();

	return (
		<m.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex min-h-screen items-center justify-center bg-background p-4"
		>
			<Card className="w-full max-w-md">
				<CardHeader>
					<CardTitle className="font-extrabold text-xl tracking-tight">
						{t("exam.paperInfo", {
							subject,
							paperCode,
						})}
					</CardTitle>
					<p className="text-muted-foreground text-sm">
						{t("exam.paperMeta", {
							year,
							period: examPeriod,
							marks: totalMarks,
							duration,
						})}
					</p>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<Button size="lg" onClick={onStartMock}>
						<HugeiconsIcon icon={Alert01Icon} data-icon="inline-start" />
						{t("exam.startMockExam")}
					</Button>
					<Button variant="outline" size="lg" onClick={onStartTimed}>
						<HugeiconsIcon icon={Clock01Icon} data-icon="inline-start" />
						{t("exam.startTimed")}
					</Button>
					<Button variant="ghost" size="lg" onClick={onStartPractice}>
						<HugeiconsIcon icon={PlayFreeIcons} data-icon="inline-start" />
						{t("exam.startPractice")}
					</Button>
				</CardContent>
			</Card>
		</m.div>
	);
}
