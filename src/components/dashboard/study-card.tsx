"use client";

import { BookOpen01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { m } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFilteredSubjects } from "@/hooks/use-subjects";
import { useRouter } from "@/i18n/navigation";

export function StudyCard() {
	const { push } = useRouter();
	const { subjects } = useFilteredSubjects("", true);

	if (subjects.length === 0) return null;

	const first = subjects[0];

	return (
		<m.div
			initial={{ opacity: 0, y: 16 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
		>
			<Card
				className="cursor-pointer overflow-hidden rounded-3xl shadow-level-1 transition-[background-color] duration-300 hover:bg-muted/50 active:scale-[0.98]"
				onClick={() => push("/dashboard")}
				role="button"
				tabIndex={0}
				aria-label={`Start studying ${first.name}`}
			>
				<CardHeader>
					<CardTitle className="font-extrabold text-lg">
						Continue Studying
					</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center gap-4 p-5 pt-0">
					<div className="flex size-12 items-center justify-center rounded-2xl bg-[--system-accent]/10">
						<HugeiconsIcon
							icon={BookOpen01Icon}
							className="size-6 text-[--system-accent]"
						/>
					</div>
					<div className="flex flex-col">
						<span className="font-semibold text-sm">{first.name}</span>
						<span className="text-muted-foreground text-xs">
							{subjects.length} subject{subjects.length !== 1 ? "s" : ""}{" "}
							available
						</span>
					</div>
				</CardContent>
			</Card>
		</m.div>
	);
}
