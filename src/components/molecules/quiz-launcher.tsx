"use client";

import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { SubjectSelect } from "@/components/ui/subject-select";
import { cn } from "@/lib/shared";

interface QuizLauncherProps extends React.ComponentProps<typeof Card> {
	onLaunch: (subject: string, topic?: string) => void;
	defaultSubject?: string;
}

export function QuizLauncher({
	onLaunch,
	defaultSubject,
	className,
	...props
}: QuizLauncherProps) {
	return (
		<Card className={cn("overflow-hidden", className)} {...props}>
			<CardHeader className="pb-3">
				<CardTitle className="flex items-center gap-2 font-heading text-base">
					<HugeiconsIcon icon={PlayIcon} size={20} className="text-primary" />
					Quick Practice
				</CardTitle>
				<CardDescription>Pick a subject and start a quiz.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-3">
				<SubjectSelect
					value={defaultSubject ?? ""}
					onChange={(value) => onLaunch(value)}
				/>
				<Button
					className="w-full"
					onClick={() => onLaunch(defaultSubject ?? "")}
				>
					<HugeiconsIcon icon={PlayIcon} size={18} />
					Start Quiz
				</Button>
			</CardContent>
		</Card>
	);
}
